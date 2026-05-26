import { pgTable, uuid, text, varchar, integer } from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

import { purchase } from "./purchase.schema";
import { timestamps } from "../utils/column.helper";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";
import { user } from "./auth-schema";

// TABLE
export const invoice = pgTable("invoice", {
	id: text("id").default(crypto.randomUUID()).primaryKey(),

	purchaseId: text("purchase_id")
		.notNull()
		.unique()
		.references(() => purchase.id, {
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

	uploadedBy: text("uploaded_by")
		.notNull()
		.references(() => user.id, {
			onDelete: "restrict",
		}),

	...timestamps,
});

// type
export const invoiceSchema = createSelectSchema(invoice);
export const invoiceInsertSchema = createInsertSchema(invoice);
export type InvoiceSchema = z.infer<typeof invoiceSchema>;
export type InvoiceInsertSchemaType = z.infer<typeof invoiceInsertSchema>;

export const invoiceRelations = relations(invoice, ({ one }) => ({
	purchase: one(purchase, {
		fields: [invoice.purchaseId],
		references: [purchase.id],
	}),

	uploadedByUser: one(user, {
		fields: [invoice.uploadedBy],
		references: [user.id],
	}),
}));
