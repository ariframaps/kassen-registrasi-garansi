import { pgTable, uuid, varchar, text } from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";
import { timestamps } from "../utils/column.helper";

import { purchase } from "./purchase.schema";
import { customerCategory } from "./customer_category.schema";
import { product } from "./product.schema";
import { waitingList } from "./waiting_list.schema";
import { user } from "./auth-schema";
import { createSelectSchema } from "drizzle-zod";
import z from "zod";

// TABLE
export const customer = pgTable("customer", {
	id: text("id").default(crypto.randomUUID()).primaryKey(),

	customId: varchar("custom_id", { length: 100 }).notNull().unique(),

	userId: text("user_id").references(() => user.id).unique(),

	categoryId: text("category_id").references(() => customerCategory.id, {
		onDelete: "set null",
	}),

	name: varchar("name", { length: 255 }).notNull(),

	email: varchar("email", { length: 255 }).unique(),

	phone: varchar("phone", { length: 50 }),

	address: text("address"),

	...timestamps,
});

// schema
export const customerSchema = createSelectSchema(customer);
// export const productInsertSchema = createInsertSchema(product);
// export const productUpdateSchema = createUpdateSchema(product);
export type CustomerSchema = z.infer<typeof customerSchema>;
// export type ProductInsertSchema = z.infer<typeof productInsertSchema>;
// export type ProductUpdateSchema = z.infer<typeof productUpdateSchema>;

export const customersRelations = relations(customer, ({ one, many }) => ({
	category: one(customerCategory, {
		fields: [customer.categoryId],
		references: [customerCategory.id],
	}),

	user: one(user, {
		fields: [customer.userId],
		references: [user.id],
	}),

	purchases: many(purchase),

	products: many(product),

	waitingList: many(waitingList),
}));
