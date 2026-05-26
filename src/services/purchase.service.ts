import { db } from "@/db";
import {
	categorySchema,
	customerSchema,
	dealerSchema,
	invoiceSchema,
	productSchema,
	productTypeSchema,
	purchaseItem,
	PurchaseItemsSchema,
	purchaseItemsSchema,
	purchaseSchema,
} from "@/db/schema";
import { userSchema } from "better-auth";
import { eq } from "drizzle-orm";
import z from "zod";

export const purchaseWithNestedSchema = purchaseSchema
	.extend({
		customer: customerSchema,
	})
	.extend({
		dealer: dealerSchema.nullable(),
	})
	.extend({
		registeredByUser: userSchema,
	})
	.extend({
		invoice: invoiceSchema,
	});

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

		const parsed = purchaseWithNestedSchema.array().parse(result);
		return parsed;
	},

	getAllPurchaseProductItem: async ({
		purchaseId,
	}: {
		purchaseId: string;
	}): Promise<PurchaseItemsSchema[]> => {
		const result = await db.query.purchaseItem.findMany({
			with: {
				product: {
					with: {
						productType: {
							with: {
								category: true,
							},
						},
					},
				},
			},
			where: eq(purchaseItem.purchaseId, purchaseId),
		});

		const parsed = purchaseItemsWithNestedSchema.array().parse(result);
		return parsed;
	},
};
