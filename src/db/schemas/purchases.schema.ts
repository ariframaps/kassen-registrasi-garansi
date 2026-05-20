import { pgTable, uuid, date, text, pgEnum, index } from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

import { customers } from "./customers.schema";
import { dealers } from "./dealers.schema";
import { users } from "./users.schema";
import { timestamps } from "../utils/column.helper";
import { invoices } from "./invoices.schema";
import { purchaseItems } from "./purchase_items.schema";

// ENUM
export const purchaseSourceEnum = pgEnum("purchase_source", [
	"direct_sales",
	"dealer",
]);

// TABLE
export const purchases = pgTable(
	"purchases",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		purchaseDate: date("purchase_date").notNull(),

		customerId: uuid("customer_id")
			.notNull()
			.references(() => customers.id, {
				onDelete: "restrict",
			}),

		dealerId: uuid("dealer_id").references(() => dealers.id, {
			onDelete: "set null",
		}),

		registeredBy: uuid("registered_by")
			.notNull()
			.references(() => users.id, {
				onDelete: "restrict",
			}),

		source: purchaseSourceEnum("source").notNull(),

		notes: text("notes"),

		...timestamps,
	},
	(table) => [index().on(table.customerId), index().on(table.dealerId)],
);

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
	customer: one(customers, {
		fields: [purchases.customerId],
		references: [customers.id],
	}),

	dealer: one(dealers, {
		fields: [purchases.dealerId],
		references: [dealers.id],
	}),

	registeredByUser: one(users, {
		fields: [purchases.registeredBy],
		references: [users.id],
	}),

	items: many(purchaseItems),

	invoice: one(invoices),
}));
