import { pgTable, uuid, date, text, pgEnum, index } from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

import { customer } from "./customer.schema";
import { dealers } from "./dealer.schema";
import { timestamps } from "../utils/column.helper";
import { invoice } from "./invoice.schema";
import { purchaseItem } from "./purchase_item.schema";
import { user } from "./auth-schema";
import z from "zod";
import { createSelectSchema } from "drizzle-zod";

// ENUM
export const purchaseSourceEnum = pgEnum("purchase_source", [
	"direct_sales",
	"dealer",
]);

// TABLE
export const purchase = pgTable(
	"purchase",
	{
		id: text("id").default(crypto.randomUUID()).primaryKey(),

		purchaseDate: date("purchase_date").notNull(),

		customerId: text("customer_id")
			.notNull()
			.references(() => customer.id, {
				onDelete: "restrict",
			}),

		dealerId: text("dealer_id").references(() => dealers.id, {
			onDelete: "set null",
		}),

		registeredBy: text("registered_by")
			.notNull()
			.references(() => user.id, {
				onDelete: "restrict",
			}),

		source: purchaseSourceEnum("source").notNull(),

		notes: text("notes"),

		...timestamps,
	},
	(table) => [index().on(table.customerId), index().on(table.dealerId)],
);

// schema
export const purchaseSchema = createSelectSchema(purchase);
// export const productInsertSchema = createInsertSchema(product);
// export const productUpdateSchema = createUpdateSchema(product);
export type PurchaseSchema = z.infer<typeof purchaseSchema>;
// export type ProductInsertSchema = z.infer<typeof productInsertSchema>;
// export type ProductUpdateSchema = z.infer<typeof productUpdateSchema>;

export const purchaseRelations = relations(purchase, ({ one, many }) => ({
	customer: one(customer, {
		fields: [purchase.customerId],
		references: [customer.id],
	}),

	dealer: one(dealers, {
		fields: [purchase.dealerId],
		references: [dealers.id],
	}),

	registeredByUser: one(user, {
		fields: [purchase.registeredBy],
		references: [user.id],
	}),

	items: many(purchaseItem),

	invoice: one(invoice),
}));
