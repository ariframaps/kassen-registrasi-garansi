import { db } from "@/db";
import {
	categorySchema,
	itemCodeMapping,
	ItemCodeMapsSchema,
	itemCodeMapsSchema,
	productSchema,
	productType,
	ProductTypeInsertSchema,
	productTypeSchema,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import z from "zod";

export const productTypeWithNestedSchema = productTypeSchema.extend({
	category: categorySchema,
});

export type ProductTypeWithNestedSchema = z.infer<
	typeof productTypeWithNestedSchema
>;

export const productTypeService = {
	getAllWithNested: async (): Promise<ProductTypeWithNestedSchema[]> => {
		const result = await db.query.productType.findMany({
			with: {
				category: true,
			},
		});

		const parsed = productTypeWithNestedSchema.array().parse(result);
		return parsed;
	},

	add: async (
		data: ProductTypeInsertSchema,
	): Promise<ProductTypeWithNestedSchema> => {
		console.log(data, "miaw");
		const newType = await db.insert(productType).values(data).returning();
		console.log(newType, " meng");
		const parsedNewType = productTypeSchema.array().parse(newType);

		const getNestedData = await db.query.productType.findFirst({
			where: eq(productType.id, parsedNewType[0].id),
			with: {
				category: true,
			},
		});
		const parsedNestedData = productTypeWithNestedSchema.parse(getNestedData);
		return parsedNestedData;
	},
};
