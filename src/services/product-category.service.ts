import { db } from "@/db";
import { categorySchema, CategorySchema } from "@/db/schema";

export const productCategoryService = {
	getAll: async (): Promise<CategorySchema[]> => {
		const result = await db.query.productCategory.findMany({});
		const parsed = categorySchema.array().parse(result);
		return parsed;
	},
};
