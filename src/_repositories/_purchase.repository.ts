// import { db } from "@/db";
// import {
// 	customerSchema,
// 	dealerSchema,
// 	invoiceSchema,
// 	purchaseSchema,
// } from "@/db/schema";
// import { userSchema } from "better-auth";
// import z from "zod";

// export const purchaseWithNestedSchema = purchaseSchema
// 	.extend({
// 		customer: customerSchema,
// 	})
// 	.extend({
// 		dealer: dealerSchema.nullable(),
// 	})
// 	.extend({
// 		registeredByUser: userSchema,
// 	})
// 	.extend({
// 		invoice: invoiceSchema,
// 	});

// export type PurchaseWithNestedSchema = z.infer<typeof purchaseWithNestedSchema>;

// export const purchaseRepository = {
// 	getAllWithNested: async (): Promise<PurchaseWithNestedSchema[]> => {
// 		const result = await db.query.purchase.findMany({
// 			with: {
// 				customer: true,
// 				dealer: true,
// 				registeredByUser: true,
// 				invoice: true,
// 			},
// 		});

// 		const parsed = purchaseWithNestedSchema.array().parse(result);
// 		return parsed;
// 	},
// };
