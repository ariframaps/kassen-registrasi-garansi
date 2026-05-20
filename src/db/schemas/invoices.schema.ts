import { pgTable, uuid, text, varchar, integer } from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

import { users } from "./users.schema";
import { purchases } from "./purchases.schema";
import { timestamps } from "../utils/column.helper";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

// TABLE
export const invoices = pgTable("invoices", {
	id: uuid("id").defaultRandom().primaryKey(),

	purchaseId: uuid("purchase_id")
		.notNull()
		.unique()
		.references(() => purchases.id, {
			onDelete: "cascade",
		}),

	storagePath: text("storage_path").notNull(),

	originalFilename: varchar("original_filename", {
		length: 255,
	}).notNull(),

	mimeType: varchar("mime_type", {
		length: 100,
	}).notNull(),

	fileSizeBytes: integer("file_size_bytes").notNull(),

	uploadedBy: uuid("uploaded_by")
		.notNull()
		.references(() => users.id, {
			onDelete: "restrict",
		}),

	...timestamps,
});

// type
export const invoicesInsertSchema = createInsertSchema(invoices);
export type InvoicesInsertSchemaType = z.infer<typeof invoicesInsertSchema>;

export const invoicesRelations = relations(invoices, ({ one }) => ({
	purchase: one(purchases, {
		fields: [invoices.purchaseId],
		references: [purchases.id],
	}),

	uploadedByUser: one(users, {
		fields: [invoices.uploadedBy],
		references: [users.id],
	}),
}));
