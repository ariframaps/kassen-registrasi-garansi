import { pgTable, uuid, varchar, text } from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";
import { timestamps } from "../utils/column.helper";
import { productType } from "./product_type.schema";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";
import z from "zod";

// TABLE
export const productCategory = pgTable("product_category", {
	id: text("id").default(crypto.randomUUID()).primaryKey(),

	name: varchar("name", { length: 255 }).notNull().unique(),

	...timestamps,
});

export const productCategoryRelations = relations(
	productCategory,
	({ many }) => ({
		productTypes: many(productType),
	}),
);

// schema
export const categorySchema = createSelectSchema(productCategory);
// export const categoryInsertSchema = createInsertSchema(productCategory);
// export const categoryUpdateSchema = createUpdateSchema(productCategory);
export type CategorySchema = z.infer<typeof categorySchema>;
// export type CategoryInserSchema = z.infer<typeof categoryInsertSchema>;
// export type CategoryUpdateSchema = z.infer<typeof categoryUpdateSchema>;
