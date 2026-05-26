import { db } from "@/db";
import {
	categorySchema,
	customerSchema,
	dealerSchema,
	doSchema,
	product,
	ProductSchema,
	productSchema,
	productType,
	ProductTypeInsertSchema,
	ProductTypeSchema,
	productTypeSchema,
	userSchema,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import z from "zod";
import { ProductTypeWithNestedSchema } from "./product-type.service";

export const productWithNestedSchema = productSchema
	.extend({
		productType: productTypeSchema.extend({
			category: categorySchema,
		}),
	})
	.extend({
		dealer: dealerSchema.nullable(),
	})
	.extend({
		deliveryOrder: doSchema.extend({
			destinationCustomer: customerSchema.optional(),
			uploadedByUser: userSchema,
		}),
	});

export type ProductWithNestedSchema = z.infer<typeof productWithNestedSchema>;

export const productService = {
	// getAll: async (): Promise<ProductSchema[]> => {
	// 	const products = await productRepository.getAll();
	// 	return products;
	// },
	// findOneById: async ({ id }: { id: string }): Promise<ProductSchema> => {
	// 	const product = await productRepository.findOne({ findBy: "id", key: id });
	// 	if (!product) throw new Error("product not found");
	// 	return product;
	// },
	findOneBySN: async ({
		SN,
	}: {
		SN: string;
	}): Promise<ProductSchema | undefined> => {
		const result = await db.query.product.findFirst({
			where: eq(product.serialNumber, SN),
		});

		if (result === undefined) return undefined;

		const parsed = productSchema.parse(result);
		return parsed;
	},

	getAllWithNested: async (): Promise<ProductWithNestedSchema[]> => {
		const result = await db.query.product.findMany({
			with: {
				productType: {
					with: {
						category: true,
					},
				},
				dealer: true,
				deliveryOrder: {
					with: {
						customer: true,
						uploadedByUser: true,
					},
				},
			},
		});

		const parsed = productWithNestedSchema.array().parse(result);
		return parsed;
	},
};
