import { timestamp } from "drizzle-orm/pg-core";

// columns.helpers.ts
export const timestamps = {
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),

	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	deletedAt: timestamp("deleted_at", { withTimezone: true }),
};
