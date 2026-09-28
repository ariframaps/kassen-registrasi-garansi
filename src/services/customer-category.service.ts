import { db } from "@/db";
import {
	auditLog,
	customerCategory,
	customerCategorySchema,
	CustomerCategorySchema,
} from "@/db/schema";
import { HTTP_STATUS } from "@/constants/http-status.constant";
import { HttpError } from "@/lib/api/http-error";
import { eq } from "drizzle-orm";
import z from "zod";

interface AuditContext {
	userId: string;
	ipAddress?: string | null;
	userAgent?: string | null;
}

export const addCustomerCategorySchema = z.object({
	name: z.string().trim().min(1, "Nama kategori wajib diisi").max(255),
});
export type AddCustomerCategoryPayload = z.infer<
	typeof addCustomerCategorySchema
>;

export const updateCustomerCategorySchema = z.object({
	name: z.string().trim().min(1, "Nama kategori wajib diisi").max(255),
});
export type UpdateCustomerCategoryPayload = z.infer<
	typeof updateCustomerCategorySchema
>;

export const customerCategoryService = {
	getAll: async (): Promise<CustomerCategorySchema[]> => {
		const result = await db.query.customerCategory.findMany({});
		return customerCategorySchema.array().parse(result);
	},

	add: async (
		data: AddCustomerCategoryPayload,
		audit: AuditContext,
	): Promise<CustomerCategorySchema> => {
		const existing = await db.query.customerCategory.findFirst({
			where: eq(customerCategory.name, data.name),
		});
		if (existing) {
			throw new HttpError(
				"Nama kategori sudah terdaftar.",
				HTTP_STATUS.CONFLICT.code,
			);
		}

		const [result] = await db
			.insert(customerCategory)
			.values({ id: crypto.randomUUID(), name: data.name })
			.returning();

		if (!result) {
			throw new HttpError(
				"Gagal menambahkan kategori.",
				HTTP_STATUS.BAD_GATEWAY.code,
			);
		}

		const parsed = customerCategorySchema.parse(result);

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: audit.userId,
			category: "PURCHASE",
			event: "CUSTOMER_CATEGORY_ADDED",
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
		data: UpdateCustomerCategoryPayload,
		audit: AuditContext,
	): Promise<CustomerCategorySchema> => {
		const existing = await db.query.customerCategory.findFirst({
			where: eq(customerCategory.id, id),
		});
		if (!existing) {
			throw new HttpError(
				"Kategori tidak ditemukan.",
				HTTP_STATUS.NOT_FOUND.code,
			);
		}

		const duplicate = await db.query.customerCategory.findFirst({
			where: eq(customerCategory.name, data.name),
		});
		if (duplicate && duplicate.id !== id) {
			throw new HttpError(
				"Nama kategori sudah terdaftar.",
				HTTP_STATUS.CONFLICT.code,
			);
		}

		const [result] = await db
			.update(customerCategory)
			.set({ name: data.name, updatedAt: new Date() })
			.where(eq(customerCategory.id, id))
			.returning();

		if (!result) {
			throw new HttpError(
				"Gagal memperbarui kategori.",
				HTTP_STATUS.BAD_GATEWAY.code,
			);
		}

		const parsed = customerCategorySchema.parse(result);

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: audit.userId,
			category: "PURCHASE",
			event: "CUSTOMER_CATEGORY_UPDATED",
			status: "success",
			priority: "medium",
			ipAddress: audit.ipAddress ?? undefined,
			userAgent: audit.userAgent ?? undefined,
			data: { categoryId: id, name: data.name },
		});

		return parsed;
	},

	delete: async (id: string, audit: AuditContext): Promise<void> => {
		const existing = await db.query.customerCategory.findFirst({
			where: eq(customerCategory.id, id),
		});
		if (!existing) {
			throw new HttpError(
				"Kategori tidak ditemukan.",
				HTTP_STATUS.NOT_FOUND.code,
			);
		}

		// customer.categoryId uses ON DELETE SET NULL, so this never conflicts with a FK.
		await db.delete(customerCategory).where(eq(customerCategory.id, id));

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: audit.userId,
			category: "PURCHASE",
			event: "CUSTOMER_CATEGORY_DELETED",
			status: "success",
			priority: "medium",
			ipAddress: audit.ipAddress ?? undefined,
			userAgent: audit.userAgent ?? undefined,
			data: { categoryId: id, name: existing.name },
		});
	},
};
