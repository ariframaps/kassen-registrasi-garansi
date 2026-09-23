import { db } from "@/db";
import { auditLog, categorySchema, CategorySchema, productCategory } from "@/db/schema";
import { HTTP_STATUS } from "@/constants/http-status.constant";
import { HttpError } from "@/lib/api/http-error";
import { eq } from "drizzle-orm";
import z from "zod";

interface AuditContext {
	userId: string;
	ipAddress?: string | null;
	userAgent?: string | null;
}

export const addCategorySchema = z.object({
	name: z.string().trim().min(1, "Nama kategori wajib diisi").max(255),
});
export type AddCategoryPayload = z.infer<typeof addCategorySchema>;

export const updateCategorySchema = z.object({
	name: z.string().trim().min(1, "Nama kategori wajib diisi").max(255),
});
export type UpdateCategoryPayload = z.infer<typeof updateCategorySchema>;

export const productCategoryService = {
	getAll: async (): Promise<CategorySchema[]> => {
		const result = await db.query.productCategory.findMany({});
		const parsed = categorySchema.array().parse(result);
		return parsed;
	},

	add: async (
		data: AddCategoryPayload,
		audit: AuditContext,
	): Promise<CategorySchema> => {
		const existing = await db.query.productCategory.findFirst({
			where: eq(productCategory.name, data.name),
		});
		if (existing) {
			throw new HttpError(
				"Nama kategori sudah terdaftar.",
				HTTP_STATUS.CONFLICT.code,
			);
		}

		const [result] = await db
			.insert(productCategory)
			.values({ id: crypto.randomUUID(), name: data.name })
			.returning();

		if (!result) {
			throw new HttpError(
				"Gagal menambahkan kategori.",
				HTTP_STATUS.BAD_GATEWAY.code,
			);
		}

		const parsed = categorySchema.parse(result);

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: audit.userId,
			category: "PRODUCT",
			event: "PRODUCT_CATEGORY_ADDED",
			status: "success",
			priority: "medium",
			ipAddress: audit.ipAddress ?? undefined,
			userAgent: audit.userAgent ?? undefined,
			data: { categoryId: parsed.id, name: parsed.name },
		});

		return parsed;
	},

	update: async (
		id: string,
		data: UpdateCategoryPayload,
		audit: AuditContext,
	): Promise<CategorySchema> => {
		const existing = await db.query.productCategory.findFirst({
			where: eq(productCategory.id, id),
		});
		if (!existing) {
			throw new HttpError(
				"Kategori tidak ditemukan.",
				HTTP_STATUS.NOT_FOUND.code,
			);
		}

		const duplicate = await db.query.productCategory.findFirst({
			where: eq(productCategory.name, data.name),
		});
		if (duplicate && duplicate.id !== id) {
			throw new HttpError(
				"Nama kategori sudah terdaftar.",
				HTTP_STATUS.CONFLICT.code,
			);
		}

		const [result] = await db
			.update(productCategory)
			.set({ name: data.name, updatedAt: new Date() })
			.where(eq(productCategory.id, id))
			.returning();

		if (!result) {
			throw new HttpError(
				"Gagal memperbarui kategori.",
				HTTP_STATUS.BAD_GATEWAY.code,
			);
		}

		const parsed = categorySchema.parse(result);

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: audit.userId,
			category: "PRODUCT",
			event: "PRODUCT_CATEGORY_UPDATED",
			status: "success",
			priority: "medium",
			ipAddress: audit.ipAddress ?? undefined,
			userAgent: audit.userAgent ?? undefined,
			data: { categoryId: id, name: data.name },
		});

		return parsed;
	},

	delete: async (id: string, audit: AuditContext): Promise<void> => {
		const existing = await db.query.productCategory.findFirst({
			where: eq(productCategory.id, id),
		});
		if (!existing) {
			throw new HttpError(
				"Kategori tidak ditemukan.",
				HTTP_STATUS.NOT_FOUND.code,
			);
		}

		try {
			await db.delete(productCategory).where(eq(productCategory.id, id));
		} catch (error) {
			const err = error as { code?: string; message?: string };
			if (err.code === "23503") {
				throw new HttpError(
					"Tidak dapat menghapus kategori ini karena masih digunakan oleh tipe produk.",
					HTTP_STATUS.BAD_REQUEST.code,
				);
			}
			throw new HttpError(
				err.message || "Internal Server Error",
				HTTP_STATUS.INTERNAL_SERVER_ERROR.code,
			);
		}

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: audit.userId,
			category: "PRODUCT",
			event: "PRODUCT_CATEGORY_DELETED",
			status: "success",
			priority: "medium",
			ipAddress: audit.ipAddress ?? undefined,
			userAgent: audit.userAgent ?? undefined,
			data: { categoryId: id, name: existing.name },
		});
	},
};
