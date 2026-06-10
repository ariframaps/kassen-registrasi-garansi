import {
	pgTable,
	uuid,
	varchar,
	pgEnum,
	timestamp,
	index,
	text,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

import { dealers } from "./dealer.schema";
import { product } from "./product.schema";
import { user } from "./auth-schema";
import { productType } from "./product_type.schema";
import { createSelectSchema } from "drizzle-zod";
import z from "zod";

// ENUMS
export const requesterTypeEnum = pgEnum("requester_type", [
	"end_user",
	"dealer",
]);

export const waitingListStatusEnum = pgEnum("waiting_list_status", [
	"pending",
	"notified",
]);

// TABLE
export const waitingList = pgTable(
	"waiting_list",
	{
		id: text("id").default(crypto.randomUUID()).primaryKey(),

		serialNumberRequested: varchar("serial_number_requested", {
			length: 100,
		}).notNull(),

		requesterType: requesterTypeEnum("requester_type").notNull(),

		requesterName: varchar("requester_name", {
			length: 255,
		}),

		requesterEmail: varchar("requester_email", {
			length: 255,
		}),

		requesterPhone: varchar("requester_phone", {
			length: 50,
		}),

		dealerId: text("dealer_id").references(() => dealers.id, {
			onDelete: "set null",
		}),

		productId: text("product_id").references(() => product.id, {
			onDelete: "set null",
		}),

		productTypeId: text("product_type_id").references(() => productType.id, {
			onDelete: "set null",
		}),

		status: waitingListStatusEnum("status").notNull().default("pending"),

		notifiedAt: timestamp("notified_at", {
			withTimezone: true,
		}),

		resolvedAt: timestamp("resolved_at", {
			withTimezone: true,
		}),

		notifiedBy: text("notified_by").references(() => user.id, {
			onDelete: "set null",
		}),

		createdAt: timestamp("created_at", {
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index().on(table.serialNumberRequested),

		index().on(table.status, table.createdAt),

		index().on(table.dealerId),
	],
);

export const waitingListRelations = relations(waitingList, ({ one }) => ({
	dealer: one(dealers, {
		fields: [waitingList.dealerId],
		references: [dealers.id],
	}),

	product: one(product, {
		fields: [waitingList.productId],
		references: [product.id],
	}),

	type: one(productType, {
		fields: [waitingList.productTypeId],
		references: [productType.id],
	}),

	notifiedByUser: one(user, {
		fields: [waitingList.notifiedBy],
		references: [user.id],
	}),
}));

// schema
export const waitingListSchema = createSelectSchema(waitingList);
// export const productTypeInsertSchema = createInsertSchema(productType);
// export const productTypeUpdateSchema = createUpdateSchema(productType);
export type WaitingListSchema = z.infer<typeof waitingListSchema>;
// export type ProductTypeInsertSchema = z.infer<typeof productTypeInsertSchema>;
// export type ProductTypeUpdateSchema = z.infer<typeof productTypeUpdateSchema>;
