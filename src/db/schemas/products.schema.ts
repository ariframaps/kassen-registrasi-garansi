import {
	pgTable,
	uuid,
	varchar,
	date,
	pgEnum,
	index,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

import { productTypes } from "./product_types.schema";
import { deliveryOrders } from "./delivery_orders.schema";
import { dealers } from "./dealers.schema";
import { timestamps } from "../utils/column.helper";
import { purchaseItems } from "./purchase_items.schema";
import { warrantyConditions } from "./warranty_conditions.schema";
import { z } from "zod";

// ENUM
export const productStatusEnum = pgEnum("product_status", [
	"unassigned",
	"assigned",
	"warranty_active",
	"warranty_expired",
]);

// TABLE
export const products = pgTable(
	"products",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		serialNumber: varchar("serial_number", { length: 100 }).notNull().unique(),

		productTypeId: uuid("product_type_id")
			.notNull()
			.references(() => productTypes.id, {
				onDelete: "restrict",
			}),

		deliveryOrderId: uuid("delivery_order_id")
			.notNull()
			.references(() => deliveryOrders.id, {
				onDelete: "restrict",
			}),

		dealerId: uuid("dealer_id").references(() => dealers.id, {
			onDelete: "set null",
		}),

		status: productStatusEnum("status").notNull().default("unassigned"),

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
export const productInsertSchema = createInsertSchema(products).pick({
	id: true,
	serialNumber: true,
	productTypeId: true,
	deliveryOrderId: true,
	dealerId: true,
	status: true,
	warrantyStartDate: true,
	warrantyEndDate: true,
});
export type ProductInsertSchemaType = z.infer<typeof productInsertSchema>;

// relations
export const productsRelations = relations(products, ({ one, many }) => ({
	productType: one(productTypes, {
		fields: [products.productTypeId],
		references: [productTypes.id],
	}),

	deliveryOrder: one(deliveryOrders, {
		fields: [products.deliveryOrderId],
		references: [deliveryOrders.id],
	}),

	dealer: one(dealers, {
		fields: [products.dealerId],
		references: [dealers.id],
	}),

	purchaseItem: one(purchaseItems),

	warrantyCondition: one(warrantyConditions),
}));
