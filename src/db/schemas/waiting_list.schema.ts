import {
	pgTable,
	uuid,
	varchar,
	pgEnum,
	timestamp,
	index,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

import { dealers } from "./dealers.schema";
import { products } from "./products.schema";
import { users } from "./users.schema";

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
		id: uuid("id").defaultRandom().primaryKey(),

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

		dealerId: uuid("dealer_id").references(() => dealers.id, {
			onDelete: "set null",
		}),

		productId: uuid("product_id").references(() => products.id, {
			onDelete: "set null",
		}),

		status: waitingListStatusEnum("status").notNull().default("pending"),

		notifiedAt: timestamp("notified_at", {
			withTimezone: true,
		}),

		resolvedAt: timestamp("resolved_at", {
			withTimezone: true,
		}),

		notifiedBy: uuid("notified_by").references(() => users.id, {
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

	product: one(products, {
		fields: [waitingList.productId],
		references: [products.id],
	}),

	notifiedByUser: one(users, {
		fields: [waitingList.notifiedBy],
		references: [users.id],
	}),
}));
