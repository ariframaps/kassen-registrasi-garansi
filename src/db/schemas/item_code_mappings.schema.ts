import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";
import { productTypes } from "./product_types.schema";
import { timestamps } from "../utils/column.helper";

// TABLE
export const itemCodeMappings = pgTable("item_code_mappings", {
	id: uuid("id").defaultRandom().primaryKey(),

	itemCode: varchar("item_code", { length: 100 }).notNull().unique(),

	productTypeId: uuid("product_type_id")
		.notNull()
		.references(() => productTypes.id, { onDelete: "cascade" }),

	...timestamps,
});

export const itemCodeMappingsRelations = relations(
	itemCodeMappings,
	({ one }) => ({
		productType: one(productTypes, {
			fields: [itemCodeMappings.productTypeId],
			references: [productTypes.id],
		}),
	}),
);
