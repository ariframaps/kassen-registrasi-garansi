import { db } from "@/db";
import {
	categorySchema,
	customerSchema,
	dealerSchema,
	doSchema,
	productSchema,
	productTypeSchema,
	userSchema,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import z from "zod";

// export const productWithNestedSchema = productSchema
// 	.extend({
// 		productType: productTypeSchema.extend({
// 			category: categorySchema,
// 		}),
// 	})
// 	.extend({
// 		dealer: dealerSchema.nullable(),
// 	})
// 	.extend({
// 		deliveryOrder: doSchema.extend({
// 			destinationCustomer: customerSchema.optional(),
// 			uploadedByUser: userSchema,
// 		}),
// 	});

// export type ProductWithNestedSchema = z.infer<typeof productWithNestedSchema>;

export const productRepository = {
	// findOne: async ({
	// 	findBy,
	// 	key,
	// }: {
	// 	findBy: "id" | "serial_number";
	// 	key: string;
	// }): Promise<ProductSchema | undefined> => {
	// 	const condition =
	// 		findBy === "id" ? eq(product.id, key) : eq(product.serialNumber, key);
	// 	const result = await db.select().from(product).where(condition).limit(1);
	// 	if (result.length === 0) return undefined;
	// 	const parsed = productSelectSchema.parse(result[0]);
	// 	return parsed;
	// },
	// getAll: async (): Promise<ProductSchema[]> => {
	// 	const result = await db.select().from(product);
	// 	const parsed = productSelectSchema.array().parse(result);
	// 	return parsed;
	// },
	// getAllWithNested: async (): Promise<ProductWithNestedSchema[]> => {
	// 	const result = await db.query.product.findMany({
	// 		with: {
	// 			productType: {
	// 				with: {
	// 					category: true,
	// 				},
	// 			},
	// 			dealer: true,
	// 			deliveryOrder: {
	// 				with: {
	// 					customer: true,
	// 					uploadedByUser: true,
	// 				},
	// 			},
	// 		},
	// 	});
	// 	const parsed = productWithNestedSchema.array().parse(result);
	// 	return parsed;
	// },
};
