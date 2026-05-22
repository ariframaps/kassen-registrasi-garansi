import {
	pgTable,
	uuid,
	varchar,
	boolean,
	integer,
	timestamp,
	index,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";
import { users } from "./users.schema";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";
import z from "zod";

export const otpCodes = pgTable(
	"otp_codes",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),

		codeHash: varchar("code_hash", { length: 255 }).notNull(),

		expiresAt: timestamp("expires_at", {
			withTimezone: true,
		}).notNull(),

		isActive: boolean("is_used").notNull().default(false),

		attemptCount: integer("attempt_count").notNull().default(0),

		// createdAt only (no updatedAt/deletedAt needed logically for OTP)
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		index("otp_codes_user_id_idx").on(t.userId),
		index("otp_codes_active_lookup_idx").on(t.userId, t.isActive, t.expiresAt),
	],
);

export const otpSelectSchema = createSelectSchema(otpCodes);
export const otpInsertSchema = createInsertSchema(otpCodes);
export const otpUpdateSchema = createUpdateSchema(otpCodes);
export type OtpSchema = z.infer<typeof otpSelectSchema>;
export type OtpInsertSchema = z.infer<typeof otpInsertSchema>;
export type OtpUpdateSchema = z.infer<typeof otpUpdateSchema>;

export const otpCodesRelations = relations(otpCodes, ({ one }) => ({
	user: one(users, {
		fields: [otpCodes.userId],
		references: [users.id],
	}),
}));
