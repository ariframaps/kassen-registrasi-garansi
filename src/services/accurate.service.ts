import { db } from "@/db";
import {
	product,
	deliveryOrders,
	dealers,
	customer,
	productType,
	itemCodeMapping,
	user,
	purchase,
} from "@/db/schema";
import {
	parseExcelFile,
	validateAndPreview,
	ParsedDeliveryOrder,
	PreviewRow,
} from "@/lib/parser-accurate";
import { normalizeSerialNumber } from "@/lib/utils";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function getProductTypeMappings() {
	const types = await db.query.productType.findMany({
		with: {
			category: true,
			itemCodeMappings: true,
		},
	});

	const map = new Map<string, { id: string; category: string; name: string }>();

	for (const pt of types) {
		for (const ic of pt.itemCodeMappings) {
			map.set(ic.itemCode, {
				id: pt.id,
				category: pt.category.name,
				name: pt.name,
			});
		}
	}

	return map;
}

export async function getExistingSerialNumbers(): Promise<Set<string>> {
	const products = await db
		.select({ serialNumber: product.serialNumber })
		.from(product);
	return new Set(products.map((p) => normalizeSerialNumber(p.serialNumber)));
}

export interface UploadValidationResult {
	preview: PreviewRow[];
	validCount: number;
	dupCount: number;
	unknownCount: number;
	parsed: ParsedDeliveryOrder;
}

export async function validateAccurateFile(
	file: File,
): Promise<UploadValidationResult> {
	// Check if file has already been uploaded using hash
	const buffer = await file.arrayBuffer();
	const hash = crypto
		.createHash("sha256")
		.update(Buffer.from(buffer))
		.digest("hex");

	const existingFile = await db.query.deliveryOrders.findFirst({
		where: eq(deliveryOrders.fileHash, hash),
	});

	if (existingFile) {
		throw new Error("File ini sudah pernah diupload sebelumnya");
	}

	const [parsed, existingSerials, typeMap] = await Promise.all([
		parseExcelFile(file),
		getExistingSerialNumbers(),
		getProductTypeMappings(),
	]);

	console.log(parsed);

	const { preview, validCount, dupCount, unknownCount } = validateAndPreview(
		parsed,
		existingSerials,
		typeMap,
	);

	return {
		preview,
		validCount,
		dupCount,
		unknownCount,
		parsed,
	};
}

export interface UploadSubmitOptions {
	destType: "dealer" | "customer";
	destLabel: string;
	userId: string;
	file: File;
	pendingDealerCreation?: {
		name: string;
		email: string;
		phone?: string;
	};
	pendingCustomerCreation?: {
		name: string;
		email?: string;
		phone?: string;
	};
	pendingItemCodes?: Array<{
		code: string;
		productTypeName: string;
		categoryId: string;
		warrantyDurationMonths: number;
	}>;
	purchaseData?: {
		purchaseDate: string;
		notes?: string;
		invoiceFile?: File;
		dealerId?: string;
	};
}

export async function submitAccurateFile(
	options: UploadSubmitOptions,
): Promise<{
	doNumber: string;
	productsCreated: number;
}> {
	const {
		destType,
		destLabel,
		userId,
		file,
		pendingDealerCreation,
		pendingCustomerCreation,
		pendingItemCodes,
		purchaseData,
	} = options;

	// Calculate file hash
	const buffer = await file.arrayBuffer();
	const hash = crypto
		.createHash("sha256")
		.update(Buffer.from(buffer))
		.digest("hex");

	// Check if DO already uploaded
	const existing = await db.query.deliveryOrders.findFirst({
		where: eq(deliveryOrders.fileHash, hash),
	});

	if (existing) {
		throw new Error("File ini sudah pernah diupload sebelumnya");
	}

	// Create pending item codes FIRST (before validation)
	if (pendingItemCodes && pendingItemCodes.length > 0) {
		for (const itemCode of pendingItemCodes) {
			await db.insert(productType).values({
				id: crypto.randomUUID(),
				name: itemCode.productTypeName,
				categoryId: itemCode.categoryId,
			});
		}

		for (const itemCode of pendingItemCodes) {
			const createdType = await db.query.productType.findFirst({
				where: eq(productType.name, itemCode.productTypeName),
			});

			if (createdType) {
				await db.insert(itemCodeMapping).values({
					id: crypto.randomUUID(),
					itemCode: itemCode.code,
					productTypeId: createdType.id,
				});
			}
		}
	}

	// Now validate file AFTER item codes are created
	const validation = await validateAccurateFile(file);
	const { parsed, preview } = validation;

	if (validation.validCount === 0) {
		throw new Error("Tidak ada produk valid untuk disimpan");
	}

	// Create pending dealer if provided
	if (pendingDealerCreation && destType === "dealer") {
		const newUserId = crypto.randomUUID();
		await db.insert(user).values({
			id: newUserId,
			name: pendingDealerCreation.name,
			email: pendingDealerCreation.email,
			emailVerified: false,
			role: "dealer",
			status: "active",
		});

		await db.insert(dealers).values({
			id: crypto.randomUUID(),
			userId: newUserId,
			name: pendingDealerCreation.name,
			email: pendingDealerCreation.email,
			phone: pendingDealerCreation.phone ?? null,
		});
	}

	// Create pending customer if provided
	if (pendingCustomerCreation && destType === "customer") {
		const email = pendingCustomerCreation.email?.trim()
			? pendingCustomerCreation.email.trim()
			: `customer_${crypto.randomBytes(6).toString("hex")}@system.local`;

		await db.insert(customer).values({
			id: crypto.randomUUID(),
			name: pendingCustomerCreation.name,
			email,
			phone: pendingCustomerCreation.phone ?? null,
		});
	}

	// Get dealer or customer ID
	let dealerId: string | null = null;
	let customerId: string | null = null;

	if (destType === "dealer") {
		const dealer = await db.query.dealers.findFirst({
			where: eq(dealers.name, destLabel),
		});
		if (!dealer) {
			throw new Error(`Dealer '${destLabel}' tidak ditemukan`);
		}
		dealerId = dealer.id;
	} else {
		let found = await db.query.customer.findFirst({
			where: eq(customer.name, destLabel),
		});

		if (!found) {
			// Auto-create customer if doesn't exist (fallback)
			const result = await db
				.insert(customer)
				.values({
					id: crypto.randomUUID(),
					name: destLabel,
					email: `customer_${crypto.randomBytes(6).toString("hex")}@system.local`,
				})
				.returning();

			if (!result[0]) {
				throw new Error(`Gagal membuat customer '${destLabel}'`);
			}
			found = result[0];
		}

		customerId = found.id;
	}

	// Parse date from "dd MMM yyyy" format to ISO date
	let doDate = new Date().toISOString().split("T")[0]; // Default to today
	if (parsed.date) {
		try {
			const dateObj = new Date(parsed.date);
			if (!isNaN(dateObj.getTime())) {
				doDate = dateObj.toISOString().split("T")[0];
			}
		} catch {
			// If date parsing fails, use today
		}
	}

	// Create DO record with explicit ID
	const doRecord = await db
		.insert(deliveryOrders)
		.values({
			id: crypto.randomUUID(),
			doNumber: parsed.doNumber,
			doDate,
			shipToRaw: parsed.shipTo,
			sentBy: parsed.sentBy || null,
			orderRef: parsed.orderRef || null,
			dcRef: parsed.area || null,
			destinationType: destType,
			destinationDealerId: dealerId,
			destinationCustomerId: customerId,
			uploadedBy: userId,
			fileHash: hash,
			originalFilename: file.name,
		})
		.returning();

	const doId = doRecord[0].id;

	// Get product type mapping again for save
	const typeMap = await getProductTypeMappings();

	// Create product records by matching preview with parsed items
	const productsToCreate = [];
	const validSerialNumbers = new Set(
		preview.filter((p) => p.status === "valid").map((p) => p.serialNumber),
	);

	for (const item of parsed.items) {
		const mapping = typeMap.get(item.itemCode);
		if (!mapping) continue;

		for (const sn of item.serialNumbers) {
			const normalizedSn = normalizeSerialNumber(sn);
			if (validSerialNumbers.has(normalizedSn)) {
				productsToCreate.push({
					id: crypto.randomUUID(),
					serialNumber: normalizedSn,
					productTypeId: mapping.id,
					deliveryOrderId: doId,
					dealerId: dealerId,
					status: "none" as const,
				});
			}
		}
	}

	if (productsToCreate.length > 0) {
		await db.insert(product).values(productsToCreate);
	}

	// Create purchase record if purchaseData is provided (for end customer)
	if (purchaseData && customerId && destType === "customer") {
		await db.insert(purchase).values({
			id: crypto.randomUUID(),
			purchaseDate: purchaseData.purchaseDate,
			customerId,
			dealerId: purchaseData.dealerId || null,
			registeredBy: userId,
			source: purchaseData.dealerId ? "dealer" : "direct_sales",
			notes: purchaseData.notes || null,
		});
	}

	return {
		doNumber: parsed.doNumber,
		productsCreated: productsToCreate.length,
	};
}
