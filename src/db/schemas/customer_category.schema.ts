import { pgTable, varchar, text } from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";
import { timestamps } from "../utils/column.helper";
import { customer } from "./customer.schema";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";
import z from "zod";

// TABLE
export const customerCategory = pgTable("customer_category", {
	id: text("id").default(crypto.randomUUID()).primaryKey(),

	name: varchar("name", { length: 255 }).notNull().unique(),

	...timestamps,
});

export const customerCategoryRelations = relations(
	customerCategory,
	({ many }) => ({
		customers: many(customer),
	}),
);

// schema
export const customerCategorySchema = createSelectSchema(customerCategory);
export const customerCategoryInsertSchema = createInsertSchema(customerCategory);
export const customerCategoryUpdateSchema = createUpdateSchema(customerCategory);
export type CustomerCategorySchema = z.infer<typeof customerCategorySchema>;
export type CustomerCategoryInsertSchema = z.infer<
	typeof customerCategoryInsertSchema
>;
export type CustomerCategoryUpdateSchema = z.infer<
	typeof customerCategoryUpdateSchema
>;
