import { pgTable, uuid, varchar, text } from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";
import { timestamps } from "../utils/column.helper";
import { productTypes } from "./product_types.schema";

// TABLE
export const productCategories = pgTable("product_categories", {
	id: uuid("id").defaultRandom().primaryKey(),

	name: varchar("name", { length: 255 }).notNull().unique(),

	...timestamps,
});

export const productCategoriesRelations = relations(
	productCategories,
	({ many }) => ({
		productTypes: many(productTypes),
	}),
);
