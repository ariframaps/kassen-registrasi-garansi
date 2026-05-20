import { pgTable, uuid, varchar, text } from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";
import { timestamps } from "../utils/column.helper";

import { purchases } from "./purchases.schema";

// TABLE
export const customers = pgTable("customers", {
	id: uuid("id").defaultRandom().primaryKey(),

	name: varchar("name", { length: 255 }).notNull(),

	email: varchar("email", { length: 255 }).notNull().unique(),

	phone: varchar("phone", { length: 50 }),

	address: text("address"),

	...timestamps,
});

export const customersRelations = relations(customers, ({ many }) => ({
	purchases: many(purchases),
}));
