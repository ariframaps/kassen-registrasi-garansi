import {
	pgTable,
	uuid,
	varchar,
	date,
	pgEnum,
	index,
	text,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";

import { productType } from "./product_type.schema";
import { deliveryOrders } from "./delivery_order.schema";
import { dealers } from "./dealer.schema";
import { timestamps } from "../utils/column.helper";
import { purchaseItem } from "./purchase_item.schema";
import { warrantyCondition } from "./warranty_condition.schema";
import { z } from "zod";
import { productStatus } from "@/types";

// ENUM
export const productStatusEnum = pgEnum("product_status", productStatus);

// TABLE
export const product = pgTable(
	"product",
	{
		id: text("id").default(crypto.randomUUID()).primaryKey(),

		serialNumber: varchar("serial_number", { length: 100 }).notNull().unique(),

		productTypeId: text("product_type_id")
			.notNull()
			.references(() => productType.id, {
				onDelete: "restrict",
			}),

		deliveryOrderId: text("delivery_order_id")
			.notNull()
			.references(() => deliveryOrders.id, {
				onDelete: "restrict",
			}),

		dealerId: text("dealer_id").references(() => dealers.id, {
			onDelete: "set null",
		}),

		status: productStatusEnum("status").notNull().default("none"),

		warrantyStartDate: date("warranty_start_date"),

		warrantyEndDate: date("warranty_end_date"),

		...timestamps,
	},
	(table) => [
		index().on(table.dealerId),

		index().on(table.productTypeId),

		index().on(table.deliveryOrderId),
	],
);

// schema
export const productSchema = createSelectSchema(product);
export const productInsertSchema = createInsertSchema(product);
export const productUpdateSchema = createUpdateSchema(product);
export type ProductSchema = z.infer<typeof productSchema>;
export type ProductInsertSchema = z.infer<typeof productInsertSchema>;
export type ProductUpdateSchema = z.infer<typeof productUpdateSchema>;

// relations
export const productsRelations = relations(product, ({ one, many }) => ({
	productType: one(productType, {
		fields: [product.productTypeId],
		references: [productType.id],
	}),

	deliveryOrder: one(deliveryOrders, {
		fields: [product.deliveryOrderId],
		references: [deliveryOrders.id],
	}),

	dealer: one(dealers, {
		fields: [product.dealerId],
		references: [dealers.id],
	}),

	purchaseItem: one(purchaseItem),

	warrantyCondition: one(warrantyCondition),
}));
