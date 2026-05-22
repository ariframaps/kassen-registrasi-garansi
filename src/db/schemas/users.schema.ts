import {
	pgTable,
	uuid,
	varchar,
	pgEnum,
	timestamp,
	integer,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";
import { dealers } from "./dealers.schema";
import { timestamps } from "../utils/column.helper";
import { purchases } from "./purchases.schema";
import { auditLogs } from "./audit_logs.schema";
import { notifications } from "./notifications.schema";
import { otpCodes } from "./otp_codes.schema";
import { deliveryOrders } from "./delivery_orders.schema";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";
import z from "zod";

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
	id: uuid("id").notNull().defaultRandom().primaryKey(),

	name: varchar("name", { length: 255 }).notNull(),

	email: varchar("email", { length: 255 }).notNull().unique(),

	role: userRoleEnum("role").notNull(),

	status: userStatusEnum("status").notNull().default("active"),

	lastLoginAt: timestamp("last_login_at", { withTimezone: true }),

	otpResendCount: integer("otp_resend_count").notNull().default(0),

	otpResendBlockedUntil: timestamp("otp_resend_blocked_until", {
		withTimezone: true,
	}),

	otpLastSentAt: timestamp("otp_last_sent_at", {
		withTimezone: true,
	}),

	...timestamps,
});

// type
export const userSelectSchema = createSelectSchema(users);
export const userUpdateSchema = createUpdateSchema(users);
export type UserSchema = z.infer<typeof userSelectSchema>;
export type UserUpdateSchema = z.infer<typeof userUpdateSchema>;

export const usersRelations = relations(users, ({ one, many }) => ({
	dealer: one(dealers),

	purchases: many(purchases),

	otpCodes: many(otpCodes),

	notifications: many(notifications),

	auditLogs: many(auditLogs),

	deliveryOrdersUploaded: many(deliveryOrders),
}));
