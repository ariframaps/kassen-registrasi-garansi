import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";
import { productType } from "./product_type.schema";
import { timestamps } from "../utils/column.helper";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

// TABLE
export const itemCodeMapping = pgTable("item_code_mapping", {
	id: text("id").default(crypto.randomUUID()).primaryKey(),

	itemCode: varchar("item_code", { length: 100 }).notNull().unique(),

	productTypeId: text("product_type_id")
		.notNull()
		.references(() => productType.id, { onDelete: "cascade" }),

	...timestamps,
});

export const itemCodeMappingRelations = relations(
	itemCodeMapping,
	({ one }) => ({
		productType: one(productType, {
			fields: [itemCodeMapping.productTypeId],
			references: [productType.id],
		}),
	}),
);

export const itemCodeMapsSchema = createSelectSchema(itemCodeMapping);
export const itemCodeInsertSchema = createInsertSchema(itemCodeMapping);
// export const categoryUpdateSchema = createUpdateSchema(productCategory);
export type ItemCodeMapsSchema = z.infer<typeof itemCodeMapsSchema>;
export type ItemCodeInsertSchema = z.infer<typeof itemCodeInsertSchema>;
// export type CategoryUpdateSchema = z.infer<typeof categoryUpdateSchema>;
