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
	warrantyCondition,
	warrantyCondSelectSchema,
	auditLog,
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
	})
	.extend({
		warrantyCondition: warrantyCondSelectSchema.nullable(),
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
				warrantyCondition: true,
			},
		});

		const parsed = productWithNestedSchema.array().parse(result);
		return parsed;
	},

	updateWarrantyCondition: async ({
		productId,
		condition,
		reason,
		userId,
	}: {
		productId: string;
		condition: "valid" | "rejected";
		reason: string;
		userId: string;
	}) => {
		const existingProduct = await db.query.product.findFirst({
			where: eq(product.id, productId),
		});

		if (!existingProduct) throw new Error("Product not found");

		const existingCondition = await db.query.warrantyCondition.findFirst({
			where: eq(warrantyCondition.productId, productId),
		});

		let conditionData;
		if (existingCondition) {
			await db
				.update(warrantyCondition)
				.set({
					condition,
					reason: reason || null,
					updatedBy: userId,
					updatedAt: new Date(),
				})
				.where(eq(warrantyCondition.id, existingCondition.id));
			conditionData = {
				...existingCondition,
				condition,
				reason: reason || null,
				updatedBy: userId,
				updatedAt: new Date(),
			};
		} else {
			const [newCondition] = await db
				.insert(warrantyCondition)
				.values({
					productId,
					condition,
					reason: reason || null,
					updatedBy: userId,
				})
				.returning();
			conditionData = newCondition;
		}

		// Create audit log
		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId,
			category: "WARRANTY",
			event: `Update warranty condition to ${condition}`,
			status: "success",
			priority: "high",
			data: {
				productId,
				serialNumber: existingProduct.serialNumber,
				previousCondition: existingCondition?.condition,
				newCondition: condition,
				reason: reason || null,
			},
		});

		return conditionData;
	},
};
