import {
	pgTable,
	uuid,
	varchar,
	date,
	pgEnum,
	index,
	text,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";
import { dealers } from "./dealer.schema";
import { customer } from "./customer.schema";
import { timestamps } from "../utils/column.helper";
import { product } from "./product.schema";
import { user } from "./auth-schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

// ENUM
export const destinationTypeEnum = pgEnum("destination_type", [
	"dealer",
	"customer",
]);

// TABLE
export const deliveryOrders = pgTable(
	"delivery_order",
	{
		id: text("id").default(crypto.randomUUID()).primaryKey(),

		doNumber: varchar("do_number", { length: 100 }).notNull(),

		doDate: date("do_date").notNull(),

		shipToRaw: varchar("ship_to_raw", { length: 255 }).notNull(),

		sentBy: varchar("sent_by", { length: 100 }),

		orderRef: varchar("order_ref", { length: 100 }),

		dcRef: varchar("dc_ref", { length: 100 }),

		destinationType: destinationTypeEnum("destination_type").notNull(),

		destinationDealerId: text("destination_dealer_id").references(
			() => dealers.id,
			{ onDelete: "set null" },
		),

		destinationCustomerId: text("destination_customer_id").references(
			() => customer.id,
			{ onDelete: "set null" },
		),

		uploadedBy: text("uploaded_by")
			.notNull()
			.references(() => user.id, { onDelete: "restrict" }),

		fileHash: varchar("file_hash", { length: 64 }).notNull().unique(),

		originalFilename: varchar("original_filename", { length: 255 }).notNull(),

		...timestamps,
	},
	(table) => [index().on(table.doNumber)],
);

// schema
export const doSchema = createSelectSchema(deliveryOrders);
// export const doInsertSchema = createInsertSchema(product);
// export const productUpdateSchema = createUpdateSchema(product);
export type DoSchema = z.infer<typeof doSchema>;
// export type ProductInsertSchema = z.infer<typeof productInsertSchema>;
// export type ProductUpdateSchema = z.infer<typeof productUpdateSchema>;

export const deliveryOrdersRelations = relations(
	deliveryOrders,
	({ one, many }) => ({
		uploadedByUser: one(user, {
			fields: [deliveryOrders.uploadedBy],
			references: [user.id],
		}),

		dealer: one(dealers, {
			fields: [deliveryOrders.destinationDealerId],
			references: [dealers.id],
		}),

		customer: one(customer, {
			fields: [deliveryOrders.destinationCustomerId],
			references: [customer.id],
		}),

		product: many(product),
	}),
);
