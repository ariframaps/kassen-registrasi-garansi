// import { db } from "@/db";
// import {
// 	productSchema,
// 	purchaseItem,
// 	purchaseItemsSchema,
// 	purchaseSchema,
// } from "@/db/schema";
// import { eq } from "drizzle-orm";
// import z from "zod";

// export const purchaseItemsWithNestedSchema = purchaseItemsSchema.extend({
// 	product: productSchema,
// });

// export type PurchaseItemsWithNestedSchema = z.infer<
// 	typeof purchaseItemsWithNestedSchema
// >;

// export const purchaseItemRepository = {
// 	getAllPurchaseProductItem: async ({
// 		purchaseId,
// 	}: {
// 		purchaseId: string;
// 	}): Promise<PurchaseItemsWithNestedSchema[]> => {
// 		const result = await db.query.purchaseItem.findMany({
// 			with: {
// 				product: true,
// 			},
// 			where: eq(purchaseItem.purchaseId, purchaseId),
// 		});

// 		const parsed = purchaseItemsWithNestedSchema.array().parse(result);
// 		return parsed;
// 	},
// };
