import { HTTP_STATUS } from "@/constants/http-status.constant";
import { db } from "@/db";
import {
	auditLog,
	categorySchema,
	customerSchema,
	dealerSchema,
	invoiceSchema,
	product,
	productSchema,
	productTypeSchema,
	purchase,
	purchaseItem,
	PurchaseItemsSchema,
	purchaseItemsSchema,
	purchaseSchema,
	userSchema,
} from "@/db/schema";
import { HttpError } from "@/lib/api/http-error";
import { and, eq } from "drizzle-orm";
import z from "zod";

export const purchaseWithNestedSchema = purchaseSchema
	.extend({ customer: customerSchema })
	.extend({ dealer: dealerSchema.nullable() })
	.extend({ registeredByUser: userSchema })
	.extend({ invoice: invoiceSchema });

export type PurchaseWithNestedSchema = z.infer<typeof purchaseWithNestedSchema>;

export const purchaseItemsWithNestedSchema = purchaseItemsSchema.extend({
	product: productSchema.extend({
		productType: productTypeSchema.extend({
			category: categorySchema,
		}),
	}),
});
export type PurchaseItemsWithNestedSchema = z.infer<
	typeof purchaseItemsWithNestedSchema
>;

export const updatePurchaseSchema = z.object({
	purchaseDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid"),
	notes: z
		.string()
		.nullable()
		.optional()
		.transform((v) => (v === "" ? null : v)),
});
export type UpdatePurchasePayload = z.infer<typeof updatePurchaseSchema>;

export const updatePurchaseItemsSchema = z.object({
	addedProductIds: z.array(z.string()),
	removedProductIds: z.array(z.string()),
});
export type UpdatePurchaseItemsPayload = z.infer<
	typeof updatePurchaseItemsSchema
>;

interface AuditContext {
	userId: string;
	ipAddress?: string | null;
	userAgent?: string | null;
}

function addMonths(dateStr: string, months: number): string {
	const date = new Date(dateStr + "T00:00:00Z");
	date.setUTCMonth(date.getUTCMonth() + months);
	return date.toISOString().split("T")[0];
}

export const purchaseService = {
	getAllWithNested: async (): Promise<PurchaseWithNestedSchema[]> => {
		const result = await db.query.purchase.findMany({
			with: {
				customer: true,
				dealer: true,
				registeredByUser: true,
				invoice: true,
			},
		});
		return purchaseWithNestedSchema.array().parse(result);
	},

	getAllPurchaseProductItem: async ({
		purchaseId,
	}: {
		purchaseId: string;
	}): Promise<PurchaseItemsWithNestedSchema[]> => {
		const result = await db.query.purchaseItem.findMany({
			with: {
				product: {
					with: {
						productType: { with: { category: true } },
					},
				},
			},
			where: eq(purchaseItem.purchaseId, purchaseId),
		});
		return purchaseItemsWithNestedSchema.array().parse(result);
	},

	updatePurchase: async (
		id: string,
		data: UpdatePurchasePayload,
		audit: AuditContext,
	): Promise<PurchaseWithNestedSchema> => {
		const existing = await db.query.purchase.findFirst({
			where: eq(purchase.id, id),
		});
		if (!existing)
			throw new HttpError(
				"Pembelian tidak ditemukan",
				HTTP_STATUS.NOT_FOUND.code,
			);

		await db
			.update(purchase)
			.set({
				purchaseDate: data.purchaseDate,
				notes: data.notes ?? null,
				updatedAt: new Date(),
			})
			.where(eq(purchase.id, id));

		const updated = await db.query.purchase.findFirst({
			where: eq(purchase.id, id),
			with: {
				customer: true,
				dealer: true,
				registeredByUser: true,
				invoice: true,
			},
		});
		if (!updated)
			throw new HttpError(
				"Gagal memperbarui pembelian",
				HTTP_STATUS.BAD_GATEWAY.code,
			);

		const parsed = purchaseWithNestedSchema.parse(updated);

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: audit.userId,
			category: "PURCHASE",
			event: "PURCHASE_UPDATED",
			status: "success",
			priority: "medium",
			ipAddress: audit.ipAddress ?? undefined,
			userAgent: audit.userAgent ?? undefined,
			data: { purchaseId: id, changes: data },
		});

		return parsed;
	},

	updateItems: async (
		purchaseId: string,
		data: UpdatePurchaseItemsPayload,
		audit: AuditContext,
	): Promise<PurchaseItemsWithNestedSchema[]> => {
		const currentPurchase = await db.query.purchase.findFirst({
			where: eq(purchase.id, purchaseId),
		});
		if (!currentPurchase)
			throw new HttpError(
				"Pembelian tidak ditemukan",
				HTTP_STATUS.NOT_FOUND.code,
			);

		for (const productId of data.removedProductIds) {
			await db
				.delete(purchaseItem)
				.where(
					and(
						eq(purchaseItem.purchaseId, purchaseId),
						eq(purchaseItem.productId, productId),
					),
				);
			await db
				.update(product)
				.set({
					status: "none",
					warrantyStartDate: null,
					warrantyEndDate: null,
					updatedAt: new Date(),
				})
				.where(eq(product.id, productId));
		}

		for (const productId of data.addedProductIds) {
			const productWithType = await db.query.product.findFirst({
				where: eq(product.id, productId),
				with: { productType: true },
			});
			if (!productWithType) continue;

			const warrantyEnd = addMonths(
				currentPurchase.purchaseDate,
				productWithType.productType.warrantyDurationMonths,
			);

			await db.insert(purchaseItem).values({
				id: crypto.randomUUID(),
				purchaseId,
				productId,
			});

			await db
				.update(product)
				.set({
					status: "warranty_active",
					warrantyStartDate: currentPurchase.purchaseDate,
					warrantyEndDate: warrantyEnd,
					updatedAt: new Date(),
				})
				.where(eq(product.id, productId));
		}

		const result = await db.query.purchaseItem.findMany({
			where: eq(purchaseItem.purchaseId, purchaseId),
			with: {
				product: {
					with: { productType: { with: { category: true } } },
				},
			},
		});

		const parsed = purchaseItemsWithNestedSchema.array().parse(result);

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: audit.userId,
			category: "PURCHASE",
			event: "PURCHASE_ITEMS_UPDATED",
			status: "success",
			priority: "medium",
			ipAddress: audit.ipAddress ?? undefined,
			userAgent: audit.userAgent ?? undefined,
			data: {
				purchaseId,
				addedCount: data.addedProductIds.length,
				removedCount: data.removedProductIds.length,
			},
		});

		return parsed;
	},
};
