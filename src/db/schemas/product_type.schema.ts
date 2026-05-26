import {
	pgTable,
	uuid,
	varchar,
	text,
	integer,
	unique,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";
import { productCategory } from "./product_category.schema";
import { timestamps } from "../utils/column.helper";
import { itemCodeMapping } from "./item_code_mapping.schema";
import { product } from "./product.schema";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";
import z from "zod";

// TABLE
export const productType = pgTable(
	"product_type",
	{
		id: text("id").default(crypto.randomUUID()).primaryKey(),

		categoryId: text("category_id")
			.notNull()
			.references(() => productCategory.id, { onDelete: "restrict" }),

		name: varchar("name", { length: 255 }).notNull().unique(),

		warrantyDurationMonths: integer("warranty_duration_months")
			.notNull()
			.default(12),

		...timestamps,
	},
	(table) => [unique().on(table.categoryId, table.name)],
);

// schema
export const productTypeSchema = createSelectSchema(productType);
export const productTypeInsertSchema = createInsertSchema(productType);
// export const productTypeUpdateSchema = createUpdateSchema(productType);
export type ProductTypeSchema = z.infer<typeof productTypeSchema>;
export type ProductTypeInsertSchema = z.infer<typeof productTypeInsertSchema>;
// export type ProductTypeUpdateSchema = z.infer<typeof productTypeUpdateSchema>;

export const productTypesRelations = relations(
	productType,
	({ one, many }) => ({
		category: one(productCategory, {
			fields: [productType.categoryId],
			references: [productCategory.id],
		}),

		products: many(product),

		itemCodeMappings: many(itemCodeMapping),
	}),
);
