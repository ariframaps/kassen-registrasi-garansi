import { pgTable, uuid, varchar, text, pgEnum } from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";
import { timestamps } from "../utils/column.helper";
import { product } from "./product.schema";
import { purchase } from "./purchase.schema";
import { waitingList } from "./waiting_list.schema";
import { user } from "./auth-schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

export const dealerStatusEnum = pgEnum("dealer_status", ["active", "inactive"]);

export const dealers = pgTable("dealer", {
	id: text("id").default(crypto.randomUUID()).primaryKey(),

	userId: text("user_id")
		.notNull()
		.references(() => user.id)
		.unique(),

	name: varchar("name", { length: 255 }).notNull(),

	email: varchar("email", { length: 255 }).notNull().unique(),

	phone: varchar("phone", { length: 50 }),

	address: text("address"),

	status: dealerStatusEnum("status").notNull().default("active"),

	...timestamps,
});

// schema
export const dealerSchema = createSelectSchema(dealers);
export const dealerInsertSchema = createInsertSchema(dealers);
// export const productUpdateSchema = createUpdateSchema(product);
export type DealerSchema = z.infer<typeof dealerSchema>;
export type DealerInsertSchema = z.infer<typeof dealerInsertSchema>;
// export type ProductUpdateSchema = z.infer<typeof productUpdateSchema>;

export const dealersRelations = relations(dealers, ({ one, many }) => ({
	user: one(user, {
		fields: [dealers.userId],
		references: [user.id],
	}),

	products: many(product),

	purchases: many(purchase),

	waitingList: many(waitingList),
}));
