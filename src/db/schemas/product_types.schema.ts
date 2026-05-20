import {
	pgTable,
	uuid,
	varchar,
	text,
	integer,
	unique,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";
import { productCategories } from "./product_categories.schema";
import { timestamps } from "../utils/column.helper";
import { itemCodeMappings } from "./item_code_mappings.schema";
import { products } from "./products.schema";

// TABLE
export const productTypes = pgTable(
	"product_types",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		categoryId: uuid("category_id")
			.notNull()
			.references(() => productCategories.id, { onDelete: "restrict" }),

		name: varchar("name", { length: 255 }).notNull().unique(),

		warrantyDurationMonths: integer("warranty_duration_months")
			.notNull()
			.default(12),

		...timestamps,
	},
	(table) => [unique().on(table.categoryId, table.name)],
);

export const productTypesRelations = relations(
	productTypes,
	({ one, many }) => ({
		category: one(productCategories, {
			fields: [productTypes.categoryId],
			references: [productCategories.id],
		}),

		products: many(products),

		itemCodeMappings: many(itemCodeMappings),
	}),
);
