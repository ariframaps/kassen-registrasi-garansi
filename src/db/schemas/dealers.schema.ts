import { pgTable, uuid, varchar, text, pgEnum } from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";
import { users } from "./users.schema";
import { timestamps } from "../utils/column.helper";
import { products } from "./products.schema";
import { purchases } from "./purchases.schema";
import { waitingList } from "./waiting_list.schema";

export const dealerStatusEnum = pgEnum("dealer_status", ["active", "inactive"]);

export const dealers = pgTable("dealers", {
	id: uuid("id").defaultRandom().primaryKey(),

	userId: uuid("user_id")
		.notNull()
		.references(() => users.id)
		.unique(),

	name: varchar("name", { length: 255 }).notNull(),

	email: varchar("email", { length: 255 }).notNull().unique(),

	phone: varchar("phone", { length: 50 }),

	address: text("address"),

	status: dealerStatusEnum("status").notNull().default("active"),

	...timestamps,
});

export const dealersRelations = relations(dealers, ({ one, many }) => ({
	user: one(users, {
		fields: [dealers.userId],
		references: [users.id],
	}),

	products: many(products),

	purchases: many(purchases),

	waitingList: many(waitingList),
}));
