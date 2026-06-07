import { HTTP_STATUS } from "@/constants/http-status.constant";
import { db } from "@/db";
import {
	auditLog,
	customer,
	dealers,
	deliveryOrders,
	itemCodeMapping,
	product,
	purchase,
	purchaseItem,
	user,
} from "@/db/schema";
import { HttpError } from "@/lib/api/http-error";
import { parseExcelFile, ParsedDeliveryOrder } from "@/lib/accurate-parser";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import z from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const uploadAccurateSchema = z.object({
	destType: z.enum(["dealer", "customer"]),
	destLabel: z.string().min(1, "Tujuan harus dipilih"),
});
export type UploadAccuratePayload = z.infer<typeof uploadAccurateSchema>;

interface AuditContext {
	userId: string;
	ipAddress?: string | null;
	userAgent?: string | null;
}

interface UploadResult {
	doId: string;
	doNumber: string;
	productsCreated: number;
	purchaseCreated: boolean;
}

function generateFileHash(filename: string, size: number): string {
	return `${filename}_${size}_${Date.now()}`;
}

function normalizeSerialNumber(sn: string): string {
	return sn.trim().toUpperCase();
}

function parseDateString(dateStr: string): string {
	// Convert "1 Januari 2024" to "2024-01-01"
	if (!dateStr) return new Date().toISOString().split("T")[0];

	const months: Record<string, number> = {
		januari: 1,
		februari: 2,
		maret: 3,
		april: 4,
		mei: 5,
		juni: 6,
		juli: 7,
		agustus: 8,
		september: 9,
		oktober: 10,
		november: 11,
		desember: 12,
	};

	const parts = dateStr.toLowerCase().split(/\s+/);
	if (parts.length >= 3) {
		const day = parseInt(parts[0]);
		const monthName = parts[1];
		const year = parseInt(parts[2]);
		const monthNum = months[monthName];

		if (!isNaN(day) && monthNum && !isNaN(year)) {
			return `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
		}
	}

	return new Date().toISOString().split("T")[0];
}

export const accurateService = {
	upload: async (
		file: File,
		payload: UploadAccuratePayload,
		audit: AuditContext,
	): Promise<UploadResult> => {
		// 1. Parse Excel file
		const parsed = await parseExcelFile(file);

		// 2. Check duplicate DO by hash
		const fileHash = generateFileHash(file.name, file.size);
		const existingDO = await db.query.deliveryOrders.findFirst({
			where: eq(deliveryOrders.fileHash, fileHash),
		});

		if (existingDO) {
			throw new HttpError(
				`File ini sudah pernah diupload sebelumnya (DO: ${existingDO.doNumber})`,
				HTTP_STATUS.CONFLICT.code,
			);
		}

		// 3. Validate item codes exist in system
		const unknownItemCodes: string[] = [];
		const itemCodeToProductType: Record<string, string> = {};

		for (const item of parsed.items) {
			const mapping = await db.query.itemCodeMapping.findFirst({
				where: eq(itemCodeMapping.itemCode, item.itemCode),
				with: { productType: true },
			});

			if (!mapping) {
				unknownItemCodes.push(item.itemCode);
			} else {
				itemCodeToProductType[item.itemCode] = mapping.productTypeId;
			}
		}

		if (unknownItemCodes.length > 0) {
			throw new HttpError(
				`Item code tidak dikenali: ${unknownItemCodes.join(", ")}. Harap tambahkan mapping terlebih dahulu.`,
				HTTP_STATUS.BAD_REQUEST.code,
			);
		}

		// 4. Create/lookup destination (customer or dealer)
		let destinationDealerId: string | null = null;
		let destinationCustomerId: string | null = null;

		if (payload.destType === "dealer") {
			// Try to find existing dealer by name (fuzzy match)
			const existingDealer = await db.query.dealers.findFirst({
				where: eq(dealers.name, payload.destLabel),
			});

			if (existingDealer) {
				destinationDealerId = existingDealer.id;
			} else {
				// Create new dealer + user
				const newUserId = crypto.randomUUID();
				const newDealerId = crypto.randomUUID();

				await db.transaction(async (tx) => {
					// Create user
					await tx.insert(user).values({
						id: newUserId,
						name: payload.destLabel,
						email: `dealer-${crypto.randomUUID().slice(0, 8)}@system.local`,
						emailVerified: false,
						role: "dealer",
						status: "active",
					});

					// Create dealer
					await tx.insert(dealers).values({
						id: newDealerId,
						userId: newUserId,
						name: payload.destLabel,
						email: `dealer-${crypto.randomUUID().slice(0, 8)}@system.local`,
						phone: null,
						address: null,
						status: "active",
					});
				});

				destinationDealerId = newDealerId;

				// Send magic link email (non-blocking)
				try {
					const dealerUser = await db.query.user.findFirst({
						where: eq(user.id, newUserId),
					});
					if (dealerUser) {
						await auth.api.signInMagicLink({
							body: {
								email: dealerUser.email,
								callbackURL: "/",
							},
							headers: await headers(),
						});
					}
				} catch (err) {
					console.warn("⚠️ Gagal kirim magic link ke dealer baru:", err);
				}
			}
		} else {
			// Customer destination
			let existingCustomer = await db.query.customer.findFirst({
				where: eq(customer.email, payload.destLabel),
			});

			if (!existingCustomer) {
				// Try by name
				existingCustomer = await db.query.customer.findFirst({
					where: eq(customer.name, payload.destLabel),
				});
			}

			if (existingCustomer) {
				destinationCustomerId = existingCustomer.id;
			} else {
				// Create new customer
				const newCustomerId = crypto.randomUUID();
				await db.insert(customer).values({
					id: newCustomerId,
					name: payload.destLabel,
					email: `customer-${crypto.randomUUID().slice(0, 8)}@system.local`,
					phone: null,
					address: null,
				});
				destinationCustomerId = newCustomerId;
			}
		}

		// 5. Main transaction: Create DO, Products, Purchase, PurchaseItems
		let result: UploadResult = {
			doId: "",
			doNumber: parsed.doNumber,
			productsCreated: 0,
			purchaseCreated: false,
		};

		await db.transaction(async (tx) => {
			// Create delivery order
			const doId = crypto.randomUUID();
			const doDate = parseDateString(parsed.date);

			await tx.insert(deliveryOrders).values({
				id: doId,
				doNumber: parsed.doNumber,
				doDate,
				shipToRaw: parsed.shipTo,
				sentBy: parsed.sentBy || null,
				orderRef: parsed.orderRef || null,
				dcRef: null,
				destinationType: payload.destType,
				destinationDealerId,
				destinationCustomerId,
				uploadedBy: audit.userId,
				fileHash,
				originalFilename: file.name,
			});

			result.doId = doId;

			// Create products from serial numbers
			const productIds: string[] = [];

			for (const item of parsed.items) {
				const productTypeId = itemCodeToProductType[item.itemCode];
				if (!productTypeId) continue;

				for (const sn of item.serialNumbers) {
					const normalizedSN = normalizeSerialNumber(sn);
					const productId = crypto.randomUUID();

					await tx.insert(product).values({
						id: productId,
						serialNumber: normalizedSN,
						productTypeId,
						deliveryOrderId: doId,
						dealerId: payload.destType === "dealer" ? destinationDealerId : null,
						status: "none",
						warrantyStartDate: null,
						warrantyEndDate: null,
					});

					productIds.push(productId);
					result.productsCreated++;
				}
			}

			// Create purchase record
			if (productIds.length > 0) {
				const purchaseId = crypto.randomUUID();
				const purchaseDate = doDate;

				// Determine customer for purchase
				// If dealer destination, we need to find or create a "dealer customer"
				// For now, use the destinationCustomerId or create a temp one
				let customerId = destinationCustomerId;

				if (!customerId && destinationDealerId) {
					// Create temp customer for dealer stock
					const tempCustomerId = crypto.randomUUID();
					await tx.insert(customer).values({
						id: tempCustomerId,
						name: `${payload.destLabel} - Stok`,
						email: `stock-${destinationDealerId.slice(0, 8)}@system.local`,
						phone: null,
						address: null,
					});
					customerId = tempCustomerId;
				}

				if (customerId) {
					await tx.insert(purchase).values({
						id: purchaseId,
						purchaseDate,
						customerId,
						dealerId: destinationDealerId,
						registeredBy: audit.userId,
						source: payload.destType === "dealer" ? "dealer" : "direct_sales",
						notes: `Upload dari Accurate: ${parsed.doNumber}`,
					});

					// Link products to purchase
					for (const productId of productIds) {
						await tx.insert(purchaseItem).values({
							id: crypto.randomUUID(),
							purchaseId,
							productId,
						});
					}

					result.purchaseCreated = true;
				}
			}

			// Audit log
			await tx.insert(auditLog).values({
				id: crypto.randomUUID(),
				userId: audit.userId,
				category: "UPLOAD",
				event: "ACCURATE_FILE_UPLOADED",
				status: "success",
				priority: "high",
				ipAddress: audit.ipAddress ?? undefined,
				userAgent: audit.userAgent ?? undefined,
				data: {
					doNumber: parsed.doNumber,
					doId,
					productsCreated: result.productsCreated,
					destType: payload.destType,
					destLabel: payload.destLabel,
				},
			});
		});

		return result;
	},
};
