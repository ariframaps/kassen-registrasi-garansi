import { pgTable, uuid, text, pgEnum, timestamp } from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

import { product } from "./product.schema";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { user } from "./auth-schema";

// ENUM
export const warrantyStatusEnum = pgEnum("warranty_status", [
	"valid",
	"rejected",
]);

export const warrantyCondition = pgTable("warranty_condition", {
	id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

	productId: text("product_id")
		.notNull()
		.unique()
		.references(() => product.id, {
			onDelete: "cascade",
		}),

	condition: warrantyStatusEnum("condition").notNull().default("valid"),

	reason: text("reason"),

	updatedBy: text("updated_by")
		.notNull()
		.references(() => user.id, {
			onDelete: "restrict",
		}),

	updatedAt: timestamp("updated_at", {
		withTimezone: true,
	})
		.notNull()
		.defaultNow(),
});

// type
export const warrantyCondInsertSchema = createInsertSchema(warrantyCondition);
export type WarrantyCondInsertSchemaType = z.infer<
	typeof warrantyCondInsertSchema
>;

export const warrantyConditionRelations = relations(
	warrantyCondition,
	({ one }) => ({
		product: one(product, {
			fields: [warrantyCondition.productId],
			references: [product.id],
		}),

		updatedByUser: one(user, {
			fields: [warrantyCondition.updatedBy],
			references: [user.id],
		}),
	}),
);
