import { HTTP_STATUS } from "@/constants/http-status.constant";
import { db } from "@/db";
import {
	auditLog,
	customer,
	customerCategory,
	customerSchema,
	CustomerSchema,
	purchase,
	purchaseItem,
	product,
	invoice,
	dealers,
} from "@/db/schema";
import { HttpError } from "@/lib/api/http-error";
import { eq } from "drizzle-orm";
import z from "zod";
import crypto from "crypto";
import * as XLSX from "xlsx";
import type { PurchaseGroup } from "@/types";
import type { Customer } from "@/types";

export function generateAutoCustomId(): string {
	return `AUTO-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

const optionalEmailSchema = z
	.union([z.string().email("Format email tidak valid"), z.literal("")])
	.optional()
	.transform((v) => (v ? v : null));

export const createCustomerSchema = z.object({
	customId: z.string().trim().min(1, "ID Pelanggan wajib diisi").max(100),
	name: z.string().min(1, "Nama wajib diisi"),
	email: optionalEmailSchema,
	categoryId: z.string().trim().min(1).optional().nullable(),
	phone: z
		.string()
		.max(50)
		.nullable()
		.optional()
		.transform((v) => (v === "" ? null : v)),
	address: z
		.string()
		.nullable()
		.optional()
		.transform((v) => (v === "" ? null : v)),
});
export type CreateCustomerPayload = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = z.object({
	name: z.string().min(1, "Nama wajib diisi"),
	email: optionalEmailSchema,
	categoryId: z.string().trim().min(1).optional().nullable(),
	phone: z
		.string()
		.max(50)
		.nullable()
		.optional()
		.transform((v) => (v === "" ? null : v)),
	address: z
		.string()
		.nullable()
		.optional()
		.transform((v) => (v === "" ? null : v)),
});
export type UpdateCustomerPayload = z.infer<typeof updateCustomerSchema>;

interface AuditContext {
	userId: string;
	ipAddress?: string | null;
	userAgent?: string | null;
}

export interface CustomerImportRowError {
	row: number;
	message: string;
}

export interface CustomerImportResult {
	totalRows: number;
	created: number;
	updated: number;
	skipped: number;
	errors: CustomerImportRowError[];
}

const IMPORT_HEADER_MAP: Record<string, string[]> = {
	customId: ["id pelanggan", "kode"],
	name: ["nama", "nama pelanggan"],
	category: ["kategori"],
	email: ["email"],
	phone: ["no hp", "telepon"],
	address: ["alamat"],
};

function getRowValue(
	row: Record<string, unknown>,
	candidates: string[],
): string | undefined {
	for (const key of Object.keys(row)) {
		if (!candidates.includes(key.trim().toLowerCase())) continue;
		const value = row[key];
		if (value === undefined || value === null) continue;
		const str = String(value).trim();
		if (str !== "") return str;
	}
	return undefined;
}

export const customerService = {
	getAll: async (): Promise<CustomerSchema[]> => {
		const result = await db.query.customer.findMany({});
		return customerSchema.array().parse(result);
	},

	create: async (
		data: CreateCustomerPayload,
		audit: AuditContext,
	): Promise<CustomerSchema> => {
		const existingCustomId = await db.query.customer.findFirst({
			where: eq(customer.customId, data.customId),
		});
		if (existingCustomId)
			throw new HttpError(
				"ID Pelanggan sudah terdaftar",
				HTTP_STATUS.CONFLICT.code,
			);

		if (data.email) {
			const existingEmail = await db.query.customer.findFirst({
				where: eq(customer.email, data.email),
			});
			if (existingEmail)
				throw new HttpError(
					"Email sudah terdaftar",
					HTTP_STATUS.CONFLICT.code,
				);
		}

		const result = await db
			.insert(customer)
			.values({
				id: crypto.randomUUID(),
				customId: data.customId,
				categoryId: data.categoryId ?? null,
				name: data.name.trim(),
				email: data.email,
				phone: data.phone ?? null,
				address: data.address ?? null,
			})
			.returning();

		if (!result[0])
			throw new HttpError(
				"Gagal membuat customer",
				HTTP_STATUS.BAD_GATEWAY.code,
			);

		const parsed = customerSchema.parse(result[0]);

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: audit.userId,
			category: "PURCHASE",
			event: "CUSTOMER_CREATED",
			status: "success",
			priority: "medium",
			ipAddress: audit.ipAddress ?? undefined,
			userAgent: audit.userAgent ?? undefined,
			data: { customerId: parsed.id, name: parsed.name, email: parsed.email },
		});

		return parsed;
	},

	getById: async (id: string): Promise<CustomerSchema> => {
		const result = await db.query.customer.findFirst({
			where: eq(customer.id, id),
		});
		if (!result)
			throw new HttpError(
				"Customer tidak ditemukan",
				HTTP_STATUS.NOT_FOUND.code,
			);
		return customerSchema.parse(result);
	},

	getPurchaseHistory: async (customerId: string): Promise<PurchaseGroup[]> => {
		const result = await db.query.purchase.findMany({
			where: eq(purchase.customerId, customerId),
			with: {
				dealer: true,
				items: {
					with: {
						product: true,
					},
				},
				invoice: true,
			},
			orderBy: (purchase, { desc }) => [desc(purchase.purchaseDate)],
		});

		return result.map((p) => {
			const warrantyDates = p.items
				.map((item) => {
					const endDate = item.product.warrantyEndDate as string | Date | null | undefined;
					if (!endDate) return null;
					return typeof endDate === "string" ? endDate : endDate.toISOString().split("T")[0];
				})
				.filter((date) => date != null);

			const latestWarrantyDate = warrantyDates.length > 0
				? warrantyDates.reduce((max, current) => (current > max ? current : max))
				: new Date().toISOString().split("T")[0];

			return {
				id: p.id,
				serialNumbers: p.items.map((item) => item.product.serialNumber),
				dealerName: p.dealer?.name ?? null,
				dealerId: p.dealerId ?? undefined,
				purchaseDate: p.purchaseDate,
				warrantyEndDate: latestWarrantyDate,
				invoiceUrl: p.invoice?.storagePath ?? null,
				invoiceFileName: p.invoice?.originalFilename ?? null,
				registeredById: p.registeredBy,
				registeredAt: p.createdAt.toISOString(),
				notes: p.notes ?? undefined,
			};
		}) as PurchaseGroup[];
	},

	getCustomerDetail: async (customerId: string): Promise<{
		customer: Customer;
		dealers: string[];
		totalPurchases: number;
	}> => {
		const cust = await db.query.customer.findFirst({
			where: eq(customer.id, customerId),
			with: { category: true },
		});

		if (!cust)
			throw new HttpError(
				"Customer tidak ditemukan",
				HTTP_STATUS.NOT_FOUND.code,
			);

		const purchases = await db.query.purchase.findMany({
			where: eq(purchase.customerId, customerId),
			with: { dealer: true },
		});

		const dealerSet = new Set<string>();
		purchases.forEach((p) => {
			if (p.dealer?.name) dealerSet.add(p.dealer.name);
		});

		return {
			customer: {
				id: cust.id,
				customId: cust.customId,
				name: cust.name,
				email: cust.email,
				phone: cust.phone,
				address: cust.address ?? "",
				categoryId: cust.categoryId,
				categoryName: cust.category?.name ?? null,
				created_at: cust.createdAt.toISOString(),
				updated_at: cust.updatedAt.toISOString(),
			},
			dealers: Array.from(dealerSet),
			totalPurchases: purchases.length,
		};
	},

	update: async (
		id: string,
		data: UpdateCustomerPayload,
		audit: AuditContext,
	): Promise<CustomerSchema> => {
		const existing = await db.query.customer.findFirst({
			where: eq(customer.id, id),
		});
		if (!existing)
			throw new HttpError(
				"Customer tidak ditemukan",
				HTTP_STATUS.NOT_FOUND.code,
			);

		const result = await db
			.update(customer)
			.set({
				name: data.name,
				email: data.email,
				categoryId:
					data.categoryId === undefined ? existing.categoryId : data.categoryId,
				phone: data.phone ?? null,
				address: data.address ?? null,
				updatedAt: new Date(),
			})
			.where(eq(customer.id, id))
			.returning();

		if (!result[0])
			throw new HttpError(
				"Gagal memperbarui customer",
				HTTP_STATUS.BAD_GATEWAY.code,
			);

		const parsed = customerSchema.parse(result[0]);

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: audit.userId,
			category: "PURCHASE",
			event: "CUSTOMER_UPDATED",
			status: "success",
			priority: "medium",
			ipAddress: audit.ipAddress ?? undefined,
			userAgent: audit.userAgent ?? undefined,
			data: { customerId: id, name: data.name, email: data.email },
		});

		return parsed;
	},

	delete: async (id: string, audit: AuditContext): Promise<void> => {
		const existing = await db.query.customer.findFirst({
			where: eq(customer.id, id),
		});
		if (!existing)
			throw new HttpError(
				"Customer tidak ditemukan",
				HTTP_STATUS.NOT_FOUND.code,
			);

		const existingPurchase = await db.query.purchase.findFirst({
			where: eq(purchase.customerId, id),
		});
		if (existingPurchase)
			throw new HttpError(
				"Customer memiliki riwayat pembelian dan tidak dapat dihapus",
				HTTP_STATUS.CONFLICT.code,
			);

		await db.delete(customer).where(eq(customer.id, id));

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: audit.userId,
			category: "PURCHASE",
			event: "CUSTOMER_DELETED",
			status: "success",
			priority: "medium",
			ipAddress: audit.ipAddress ?? undefined,
			userAgent: audit.userAgent ?? undefined,
			data: { customerId: id, name: existing.name },
		});
	},

	importFromExcel: async (
		buffer: Buffer,
		audit: AuditContext,
	): Promise<CustomerImportResult> => {
		const workbook = XLSX.read(buffer, { type: "buffer" });
		const sheetName = workbook.SheetNames[0];
		if (!sheetName) {
			throw new HttpError(
				"File Excel tidak memiliki sheet",
				HTTP_STATUS.BAD_REQUEST.code,
			);
		}

		const sheet = workbook.Sheets[sheetName];
		const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
			defval: "",
		});

		if (rows.length === 0) {
			throw new HttpError(
				"File Excel tidak memiliki data",
				HTTP_STATUS.BAD_REQUEST.code,
			);
		}

		const categoryCache = new Map<string, string>();
		const result: CustomerImportResult = {
			totalRows: rows.length,
			created: 0,
			updated: 0,
			skipped: 0,
			errors: [],
		};

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const rowNumber = i + 2; // +1 for header row, +1 for 0-index

			const customId = getRowValue(row, IMPORT_HEADER_MAP.customId);
			const name = getRowValue(row, IMPORT_HEADER_MAP.name);

			if (!customId || !name) {
				result.skipped++;
				result.errors.push({
					row: rowNumber,
					message: "ID Pelanggan dan Nama wajib diisi",
				});
				continue;
			}

			try {
				const categoryName = getRowValue(row, IMPORT_HEADER_MAP.category);
				let categoryId: string | null = null;

				if (categoryName) {
					const cacheKey = categoryName.toLowerCase();
					categoryId = categoryCache.get(cacheKey) ?? null;

					if (!categoryId) {
						const existingCategory = await db.query.customerCategory.findFirst({
							where: eq(customerCategory.name, categoryName),
						});

						if (existingCategory) {
							categoryId = existingCategory.id;
						} else {
							const [createdCategory] = await db
								.insert(customerCategory)
								.values({ id: crypto.randomUUID(), name: categoryName })
								.returning();
							categoryId = createdCategory?.id ?? null;
						}

						if (categoryId) categoryCache.set(cacheKey, categoryId);
					}
				}

				const email = getRowValue(row, IMPORT_HEADER_MAP.email) ?? null;
				const phone = getRowValue(row, IMPORT_HEADER_MAP.phone) ?? null;
				const address = getRowValue(row, IMPORT_HEADER_MAP.address) ?? null;

				const existingCustomer = await db.query.customer.findFirst({
					where: eq(customer.customId, customId),
				});

				if (existingCustomer) {
					await db
						.update(customer)
						.set({
							name,
							categoryId,
							email,
							phone,
							address,
							updatedAt: new Date(),
						})
						.where(eq(customer.id, existingCustomer.id));
					result.updated++;
				} else {
					await db.insert(customer).values({
						id: crypto.randomUUID(),
						customId,
						name,
						categoryId,
						email,
						phone,
						address,
					});
					result.created++;
				}
			} catch (error) {
				result.skipped++;
				const err = error as { message?: string };
				result.errors.push({
					row: rowNumber,
					message: err.message || "Gagal memproses baris",
				});
			}
		}

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: audit.userId,
			category: "PURCHASE",
			event: "CUSTOMER_IMPORTED",
			status: "success",
			priority: "medium",
			ipAddress: audit.ipAddress ?? undefined,
			userAgent: audit.userAgent ?? undefined,
			data: {
				totalRows: result.totalRows,
				created: result.created,
				updated: result.updated,
				skipped: result.skipped,
			},
		});

		return result;
	},
};
