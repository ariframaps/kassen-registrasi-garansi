import { db } from "@/db";
import {
	ProductInsertSchemaType,
	products,
} from "@/db/schemas/products.schema";
import crypto, { randomUUID } from "crypto";

const generateSN = (prefix: string, index: number) => {
	return `${prefix}-${Date.now()}-${index}`;
};

export const seedProducts = async (ctx: {
	doIds: string[];
	dealerIds: string[];
	productTypeMap: Record<string, string>;
}) => {
	const now = new Date();

	const createWarrantyEnd = (months: number) => {
		const d = new Date(now);
		d.setMonth(d.getMonth() + months);
		return d.toISOString().split("T")[0]; // date format
	};

	const rows: ProductInsertSchemaType[] = [];

	// DO 1 Dealer Alpha
	for (let i = 0; i < 3; i++) {
		rows.push({
			id: randomUUID(),
			serialNumber: generateSN("POS", i),
			productTypeId: ctx.productTypeMap["pos system"],
			deliveryOrderId: ctx.doIds[0],
			dealerId: ctx.dealerIds[0],
			status: "assigned",
			warrantyStartDate: "2026-01-10",
			warrantyEndDate: createWarrantyEnd(12),
		});
	}

	// DO 2 Dealer Beta
	for (let i = 0; i < 2; i++) {
		rows.push({
			id: randomUUID(),
			serialNumber: generateSN("SCN", i),
			productTypeId: ctx.productTypeMap["scanner"],
			deliveryOrderId: ctx.doIds[1],
			dealerId: ctx.dealerIds[1],
			status: "assigned",
			warrantyStartDate: "2026-01-15",
			warrantyEndDate: createWarrantyEnd(12),
		});
	}

	// DO 3 Customer (unassigned dealer)
	for (let i = 0; i < 2; i++) {
		rows.push({
			id: randomUUID(),
			serialNumber: generateSN("RP", i),
			productTypeId: ctx.productTypeMap["receipt printer"],
			deliveryOrderId: ctx.doIds[2],
			dealerId: null,
			status: "unassigned",
			warrantyStartDate: "2026-01-20",
			warrantyEndDate: createWarrantyEnd(12),
		});
	}

	await db.insert(products).values(rows);

	const productIds = rows.map((r) => r.id || "");
	return productIds;
};
