import { pgTable, uuid, text, pgEnum, timestamp } from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

import { products } from "./products.schema";
import { users } from "./users.schema";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

// ENUM
export const warrantyConditionEnum = pgEnum("warranty_condition", [
	"valid",
	"rejected",
]);

export const warrantyConditions = pgTable("warranty_conditions", {
	id: uuid("id").defaultRandom().primaryKey(),

	productId: uuid("product_id")
		.notNull()
		.unique()
		.references(() => products.id, {
			onDelete: "cascade",
		}),

	condition: warrantyConditionEnum("condition").notNull().default("valid"),

	reason: text("reason"),

	updatedBy: uuid("updated_by")
		.notNull()
		.references(() => users.id, {
			onDelete: "restrict",
		}),

	updatedAt: timestamp("updated_at", {
		withTimezone: true,
	})
		.notNull()
		.defaultNow(),
});

// type
export const warrantyCondInsertSchema = createInsertSchema(warrantyConditions);
export type WarrantyCondInsertSchemaType = z.infer<
	typeof warrantyCondInsertSchema
>;

export const warrantyConditionsRelations = relations(
	warrantyConditions,
	({ one }) => ({
		product: one(products, {
			fields: [warrantyConditions.productId],
			references: [products.id],
		}),

		updatedByUser: one(users, {
			fields: [warrantyConditions.updatedBy],
			references: [users.id],
		}),
	}),
);
