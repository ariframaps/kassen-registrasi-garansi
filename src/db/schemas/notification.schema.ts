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
import { createSelectSchema } from "drizzle-zod";
import z from "zod";

import { waitingList } from "./waiting_list.schema";
import { user } from "./auth-schema";

// ENUM
export const notificationTypeEnum = pgEnum("notification_type", [
	"product_ready",
	"general",
]);

// TABLE
export const notification = pgTable(
	"notification",
	{
		id: text("id").default(crypto.randomUUID()).primaryKey(),

		userId: text("user_id")
			.notNull()
			.references(() => user.id, {
				onDelete: "cascade",
			}),

		title: varchar("title", {
			length: 255,
		}).notNull(),

		body: text("body").notNull(),

		type: notificationTypeEnum("type").notNull(),

		relatedWaitingListId: text("related_waiting_list_id").references(
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

export const notificationsRelations = relations(notification, ({ one }) => ({
	user: one(user, {
		fields: [notification.userId],
		references: [user.id],
	}),

	relatedWaitingList: one(waitingList, {
		fields: [notification.relatedWaitingListId],
		references: [waitingList.id],
	}),
}));

export const notificationSelectSchema = createSelectSchema(notification);
export type NotificationSchema = z.infer<typeof notificationSelectSchema>;
