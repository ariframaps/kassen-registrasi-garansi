import {
	pgTable,
	uuid,
	varchar,
	text,
	boolean,
	pgEnum,
	timestamp,
	index,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

import { users } from "./users.schema";
import { waitingList } from "./waiting_list.schema";

// ENUM
export const notificationTypeEnum = pgEnum("notification_type", [
	"product_ready",
	"general",
]);

// TABLE
export const notifications = pgTable(
	"notifications",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, {
				onDelete: "cascade",
			}),

		title: varchar("title", {
			length: 255,
		}).notNull(),

		body: text("body").notNull(),

		type: notificationTypeEnum("type").notNull(),

		relatedWaitingListId: uuid("related_waiting_list_id").references(
			() => waitingList.id,
			{
				onDelete: "set null",
			},
		),

		isRead: boolean("is_read").notNull().default(false),

		createdAt: timestamp("created_at", {
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index().on(table.userId),

		index().on(table.userId, table.isRead),

		index().on(table.userId, table.createdAt),
	],
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id],
	}),

	relatedWaitingList: one(waitingList, {
		fields: [notifications.relatedWaitingListId],
		references: [waitingList.id],
	}),
}));
