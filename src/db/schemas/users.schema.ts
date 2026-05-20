import { pgTable, uuid, varchar, pgEnum, timestamp } from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";
import { dealers } from "./dealers.schema";
import { timestamps } from "../utils/column.helper";
import { purchases } from "./purchases.schema";
import { auditLogs } from "./audit_logs.schema";
import { notifications } from "./notifications.schema";
import { otpCodes } from "./otp_codes.schema";
import { deliveryOrders } from "./delivery_orders.schema";

// ENUMS
export const userRoleEnum = pgEnum("user_role", [
	"admin",
	"sales",
	"dealer",
	"technical_support",
]);

export const userStatusEnum = pgEnum("user_status", ["active", "inactive"]);

// TABLE
export const users = pgTable("users", {
	id: uuid("id").defaultRandom().primaryKey(),

	name: varchar("name", { length: 255 }).notNull(),

	email: varchar("email", { length: 255 }).notNull().unique(),

	role: userRoleEnum("role").notNull(),

	status: userStatusEnum("status").notNull().default("active"),

	lastLoginAt: timestamp("last_login_at", { withTimezone: true }),

	...timestamps,
});

export const usersRelations = relations(users, ({ one, many }) => ({
	dealer: one(dealers),

	purchases: many(purchases),

	otpCodes: many(otpCodes),

	notifications: many(notifications),

	auditLogs: many(auditLogs),

	deliveryOrdersUploaded: many(deliveryOrders),
}));
