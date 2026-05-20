import {
	pgTable,
	uuid,
	varchar,
	date,
	pgEnum,
	index,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";
import { users } from "./users.schema";
import { dealers } from "./dealers.schema";
import { customers } from "./customers.schema";
import { timestamps } from "../utils/column.helper";
import { products } from "./products.schema";

// ENUM
export const destinationTypeEnum = pgEnum("destination_type", [
	"dealer",
	"customer",
]);

// TABLE
export const deliveryOrders = pgTable(
	"delivery_orders",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		doNumber: varchar("do_number", { length: 100 }).notNull(),

		doDate: date("do_date").notNull(),

		shipToRaw: varchar("ship_to_raw", { length: 255 }).notNull(),

		sentBy: varchar("sent_by", { length: 100 }),

		orderRef: varchar("order_ref", { length: 100 }),

		dcRef: varchar("dc_ref", { length: 100 }),

		destinationType: destinationTypeEnum("destination_type").notNull(),

		destinationDealerId: uuid("destination_dealer_id").references(
			() => dealers.id,
			{ onDelete: "set null" },
		),

		destinationCustomerId: uuid("destination_customer_id").references(
			() => customers.id,
			{ onDelete: "set null" },
		),

		uploadedBy: uuid("uploaded_by")
			.notNull()
			.references(() => users.id, { onDelete: "restrict" }),

		fileHash: varchar("file_hash", { length: 64 }).notNull().unique(),

		originalFilename: varchar("original_filename", { length: 255 }).notNull(),

		...timestamps,
	},
	(table) => [index().on(table.doNumber)],
);

export const deliveryOrdersRelations = relations(
	deliveryOrders,
	({ one, many }) => ({
		uploadedByUser: one(users, {
			fields: [deliveryOrders.uploadedBy],
			references: [users.id],
		}),

		dealer: one(dealers, {
			fields: [deliveryOrders.destinationDealerId],
			references: [dealers.id],
		}),

		customer: one(customers, {
			fields: [deliveryOrders.destinationCustomerId],
			references: [customers.id],
		}),

		products: many(products),
	}),
);
