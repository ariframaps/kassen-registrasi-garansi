import { db } from "@/db";
import {
	productType,
	itemCodeMapping,
	productTypeSchema,
	categorySchema,
	itemCodeMapsSchema,
	auditLog,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import z from "zod";
import { productTypeInsertSchema } from "@/db/schema";
import { HttpError } from "@/lib/api/http-error";

interface AuditContext {
	userId: string;
	ipAddress?: string | null;
	userAgent?: string | null;
}

// Schema untuk payload saat membuat Product Type Baru beserta Item Codes awal
export const createProductTypePayloadSchema = productTypeInsertSchema
	.extend({
		warrantyDurationMonths: z.coerce.number().int().positive().default(12),
		itemCodes: z.array(z.string()).optional(),
	});
export type CreateProductTypePayload = z.infer<
	typeof createProductTypePayloadSchema
>;

// Schema untuk payload saat mengupdate Product Type beserta Sync Item Codes
export const updateProductTypePayloadSchema = productTypeInsertSchema
	.partial()
	.extend({
		warrantyDurationMonths: z.coerce.number().int().positive().optional(),
		data: z.object({
			added: z.array(z.string()),
			deleted: z.array(z.string()),
		}),
	});
export type UpdateProductTypePayload = z.infer<
	typeof updateProductTypePayloadSchema
>;

export const productTypeWithNestedSchema = productTypeSchema.extend({
	category: categorySchema,
	itemCodeMappings: z.array(itemCodeMapsSchema),
});

export type ProductTypeWithNestedSchema = z.infer<
	typeof productTypeWithNestedSchema
>;

export const productTypeService = {
	/**
	 * Mengambil semua Product Type beserta Nested Category & Item Code Mappings
	 */
	getAll: async (): Promise<ProductTypeWithNestedSchema[]> => {
		const data = await db.query.productType.findMany({
			with: {
				category: true,
				itemCodeMappings: true,
			},
			orderBy: (table, { desc }) => [desc(table.createdAt)],
		});

		return z.array(productTypeWithNestedSchema).parse(data);
	},

	/**
	 * Menambahkan Product Type baru sekaligus memasukkan item codes awal jika ada
	 */
	add: async (
		payload: CreateProductTypePayload,
		audit: AuditContext,
	): Promise<ProductTypeWithNestedSchema> => {
		const parsedInput = createProductTypePayloadSchema.parse(payload);
		const { itemCodes, ...productTypeData } = parsedInput;

		try {
			const result = await db.transaction(async (tx) => {
				// 1. Cek duplikasi nama secara manual untuk pesan error yang lebih user-friendly
				const existingName = await tx.query.productType.findFirst({
					where: eq(productType.name, productTypeData.name),
				});
				if (existingName) {
					throw new HttpError("Nama tipe produk sudah terdaftar.", 400);
				}

				// 2. Insert data product type utama
				const [newType] = await tx
					.insert(productType)
					.values({ ...productTypeData, id: crypto.randomUUID() })
					.returning();

				if (!newType) {
					throw new HttpError("Gagal membuat tipe produk baru.", 500);
				}

				// 3. Insert item codes jika dilampirkan
				if (itemCodes && itemCodes.length > 0) {
					const formattedCodes = itemCodes.map((code) => ({
						id: crypto.randomUUID(),
						itemCode: code.toUpperCase().trim(),
						productTypeId: newType.id,
					}));

					// Pastikan tidak ada kode yang duplikat secara global sebelum insert
					for (const item of formattedCodes) {
						const duplicateCheck = await tx.query.itemCodeMapping.findFirst({
							where: eq(itemCodeMapping.itemCode, item.itemCode),
						});
						if (duplicateCheck) {
							throw new HttpError(
								`Item code '${item.itemCode}' sudah digunakan oleh tipe lain.`,
								400,
							);
						}
					}

					await tx.insert(itemCodeMapping).values(formattedCodes);
				}

				// 4. Ambil data utuh hasil gabungan (Nested)
				return await tx.query.productType.findFirst({
					where: eq(productType.id, newType.id),
					with: {
						category: true,
						itemCodeMappings: true,
					},
				});
			});

			const parsed = productTypeWithNestedSchema.parse(result);

			// 5. Tambahkan audit log
			await db.insert(auditLog).values({
				id: crypto.randomUUID(),
				userId: audit.userId,
				category: "PRODUCT",
				event: "PRODUCT_TYPE_ADDED",
				status: "success",
				priority: "medium",
				ipAddress: audit.ipAddress ?? undefined,
				userAgent: audit.userAgent ?? undefined,
				data: {
					productTypeId: parsed.id,
					name: parsed.name,
					categoryId: parsed.categoryId,
					itemCodesCount: parsed.itemCodeMappings?.length ?? 0,
				},
			});

			return parsed;
		} catch (error) {
			if (error instanceof HttpError) throw error;
			throw new HttpError(
				error instanceof Error ? error.message : "Internal Server Error",
				500,
			);
		}
	},

	/**
	 * Mengupdate Nama, Kategori, serta melakukan Sinkronisasi (Sync) Item Codes
	 */
	update: async (
		id: string,
		payload: UpdateProductTypePayload,
		audit: AuditContext,
	): Promise<ProductTypeWithNestedSchema> => {
		const parsedInput = updateProductTypePayloadSchema.parse(payload);
		const { data: syncData, ...productTypeData } = parsedInput;

		try {
			const result = await db.transaction(async (tx) => {
				// 1. Cek apakah Product Type target ada di DB
				const currentType = await tx.query.productType.findFirst({
					where: eq(productType.id, id),
				});
				if (!currentType) {
					throw new HttpError("Tipe produk tidak ditemukan.", 404);
				}

				// 2. Update field utama (name / categoryId) jika dikirimkan
				await tx
					.update(productType)
					.set({ ...productTypeData, updatedAt: new Date() })
					.where(eq(productType.id, id));

				// 3. Hapus item codes lama yang dibuang user
				if (syncData.deleted.length > 0) {
					await tx
						.delete(itemCodeMapping)
						.where(inArray(itemCodeMapping.id, syncData.deleted));
				}

				// 4. Tambahkan item codes baru yang dimasukkan user
				if (syncData.added.length > 0) {
					const newCodes = syncData.added.map((code) => ({
						id: crypto.randomUUID(),
						itemCode: code.toUpperCase().trim(),
						productTypeId: id,
					}));

					// Validasi duplikasi global untuk item code baru
					for (const item of newCodes) {
						const duplicateCheck = await tx.query.itemCodeMapping.findFirst({
							where: eq(itemCodeMapping.itemCode, item.itemCode),
						});
						if (duplicateCheck) {
							throw new HttpError(
								`Item code '${item.itemCode}' sudah digunakan oleh tipe lain.`,
								400,
							);
						}
					}

					await tx.insert(itemCodeMapping).values(newCodes);
				}

				// 5. Ambil data ter-update
				return await tx.query.productType.findFirst({
					where: eq(productType.id, id),
					with: {
						category: true,
						itemCodeMappings: true,
					},
				});
			});

			const parsed = productTypeWithNestedSchema.parse(result);

			// 6. Tambahkan audit log
			await db.insert(auditLog).values({
				id: crypto.randomUUID(),
				userId: audit.userId,
				category: "PRODUCT",
				event: "PRODUCT_TYPE_UPDATED",
				status: "success",
				priority: "medium",
				ipAddress: audit.ipAddress ?? undefined,
				userAgent: audit.userAgent ?? undefined,
				data: {
					productTypeId: id,
					changes: {
						name: productTypeData.name,
						categoryId: productTypeData.categoryId,
						addedCodes: syncData.added,
						deletedCodeIds: syncData.deleted,
					},
				},
			});

			return parsed;
		} catch (error) {
			if (error instanceof HttpError) throw error;
			throw new HttpError(
				error instanceof Error ? error.message : "Internal Server Error",
				500,
			);
		}
	},

	/**
	 * Menghapus Product Type (Item Code otomatis terhapus berkat CASCADE pada schema)
	 */
	delete: async (id: string, audit: AuditContext): Promise<void> => {
		try {
			const currentType = await db.query.productType.findFirst({
				where: eq(productType.id, id),
			});
			if (!currentType) {
				throw new HttpError("Tipe produk tidak ditemukan.", 404);
			}

			await db.delete(productType).where(eq(productType.id, id));

			// Tambahkan audit log
			await db.insert(auditLog).values({
				id: crypto.randomUUID(),
				userId: audit.userId,
				category: "PRODUCT",
				event: "PRODUCT_TYPE_DELETED",
				status: "success",
				priority: "medium",
				ipAddress: audit.ipAddress ?? undefined,
				userAgent: audit.userAgent ?? undefined,
				data: {
					productTypeId: id,
					name: currentType.name,
					categoryId: currentType.categoryId,
				},
			});
		} catch (error) {
			if (error instanceof HttpError) throw error;

			// Deteksi error PostgreSQL 'restrict' constraint jika tipe ini terikat ke tabel produk aktif
			const err = error as { code?: string; message?: string };
			if (err.code === "23503") {
				throw new HttpError(
					"Tidak dapat menghapus tipe ini karena masih digunakan oleh produk aktif.",
					400,
				);
			}
			throw new HttpError(err.message || "Internal Server Error", 500);
		}
	},
};

// import { db } from "@/db";
// import {
// 	categorySchema,
// 	itemCodeMapping,
// 	ItemCodeMapsSchema,
// 	itemCodeMapsSchema,
// 	productSchema,
// 	productType,
// 	ProductTypeInsertSchema,
// 	productTypeSchema,
// } from "@/db/schema";
// import { eq } from "drizzle-orm";
// import z from "zod";

// export const productTypeWithNestedSchema = productTypeSchema
// 	.extend({
// 		category: categorySchema,
// 	})
// 	.extend({
// 		itemCodeMappings: itemCodeMapsSchema,
// 	});

// export type ProductTypeWithNestedSchema = z.infer<
// 	typeof productTypeWithNestedSchema
// >;

// export const productTypeService = {
// 	getAllWithNested: async (): Promise<ProductTypeWithNestedSchema[]> => {
// 		const result = await db.query.productType.findMany({
// 			with: {
// 				category: true,
// 				itemCodeMappings: true,
// 			},
//       orderBy: (productType, { desc }) => [desc(productType.createdAt)],
// 		});

// 		const parsed = productTypeWithNestedSchema.array().parse(result);
// 		return parsed;
// 	},

// 	add: async (
// 		data: ProductTypeInsertSchema,
// 	): Promise<ProductTypeWithNestedSchema> => {
// 		console.log(data, "miaw");
// 		const newType = await db.insert(productType).values(data).returning();
// 		console.log(newType, " meng");
// 		const parsedNewType = productTypeSchema.array().parse(newType);

// 		const getNestedData = await db.query.productType.findFirst({
// 			where: eq(productType.id, parsedNewType[0].id),
// 			with: {
// 				category: true,
// 			},
// 		});
// 		const parsedNestedData = productTypeWithNestedSchema.parse(getNestedData);
// 		return parsedNestedData;
// 	},
// };
