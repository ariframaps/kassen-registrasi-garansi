import { pgTable, uuid, timestamp, index } from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

import { purchases } from "./purchases.schema";
import { products } from "./products.schema";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

// TABLE
export const purchaseItems = pgTable(
	"purchase_items",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		purchaseId: uuid("purchase_id")
			.notNull()
			.references(() => purchases.id, {
				onDelete: "cascade",
			}),

		productId: uuid("product_id")
			.notNull()
			.unique()
			.references(() => products.id, {
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
export const purchaseItemsInsertSchema = createInsertSchema(purchaseItems);
export type PurchaseItemsInsertSchemaType = z.infer<
	typeof purchaseItemsInsertSchema
>;

// relations
export const purchaseItemsRelations = relations(purchaseItems, ({ one }) => ({
	purchase: one(purchases, {
		fields: [purchaseItems.purchaseId],
		references: [purchases.id],
	}),

	product: one(products, {
		fields: [purchaseItems.productId],
		references: [products.id],
	}),
}));
