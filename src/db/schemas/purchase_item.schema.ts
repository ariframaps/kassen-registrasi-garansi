import { pgTable, timestamp, index, text } from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

import { purchase } from "./purchase.schema";
import { product } from "./product.schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

// TABLE
export const purchaseItem = pgTable(
	"purchase_item",
	{
		id: text("id").default(crypto.randomUUID()).primaryKey(),

		purchaseId: text("purchase_id")
			.notNull()
			.references(() => purchase.id, {
				onDelete: "cascade",
			}),

		productId: text("product_id")
			.notNull()
			.unique()
			.references(() => product.id, {
				onDelete: "restrict",
			}),

		createdAt: timestamp("created_at", {
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
	},
	(table) => [index().on(table.purchaseId)],
);

// types
export const purchaseItemsSchema = createSelectSchema(purchaseItem);
export const purchaseItemsInsertSchema = createInsertSchema(purchaseItem);
export type PurchaseItemsSchema = z.infer<typeof purchaseItemsSchema>;
export type PurchaseItemsInsertSchemaType = z.infer<
	typeof purchaseItemsInsertSchema
>;

// relations
export const purchaseItemsRelations = relations(purchaseItem, ({ one }) => ({
	purchase: one(purchase, {
		fields: [purchaseItem.purchaseId],
		references: [purchase.id],
	}),

	product: one(product, {
		fields: [purchaseItem.productId],
		references: [product.id],
	}),
}));
