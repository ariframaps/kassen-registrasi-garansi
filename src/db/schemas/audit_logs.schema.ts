import {
	pgTable,
	uuid,
	varchar,
	text,
	pgEnum,
	timestamp,
	inet,
	jsonb,
	index,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

import { users } from "./users.schema";

// ENUMS
export const auditLogCategoryEnum = pgEnum("audit_log_category", [
	"AUTH",
	"PRODUCT",
	"DEALER",
	"PURCHASE",
	"USER",
	"WARRANTY",
	"WAITING_LIST",
	"SYSTEM",
]);

export const auditLogStatusEnum = pgEnum("audit_log_status", [
	"success",
	"error",
]);

export const auditLogPriorityEnum = pgEnum("audit_log_priority", [
	"low",
	"medium",
	"high",
]);

// TABLE
export const auditLogs = pgTable(
	"audit_logs",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		userId: uuid("user_id").references(() => users.id, {
			onDelete: "set null",
		}),

		category: auditLogCategoryEnum("category").notNull(),

		event: varchar("event", {
			length: 100,
		}).notNull(),

		status: auditLogStatusEnum("status").notNull(),

		priority: auditLogPriorityEnum("priority").notNull().default("low"),

		ipAddress: inet("ip_address"),

		userAgent: text("user_agent"),

		data: jsonb("data"),

		errorMessage: text("error_message"),

		createdAt: timestamp("created_at", {
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index().on(table.createdAt),

		index().on(table.userId),

		index().on(table.userId, table.createdAt),

		index().on(table.category),

		index().on(table.priority, table.createdAt),
	],
);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
	user: one(users, {
		fields: [auditLogs.userId],
		references: [users.id],
	}),
}));
