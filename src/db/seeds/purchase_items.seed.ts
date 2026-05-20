import { db } from "@/db";
import {
	purchaseItems,
	PurchaseItemsInsertSchemaType,
} from "@/db/schemas/purchase_items.schema";
import crypto, { randomUUID } from "crypto";

export const seedPurchaseItems = async (ctx: {
	purchaseIds: string[];
	productIds: string[];
}) => {
	const rows: PurchaseItemsInsertSchemaType[] = [];

	// ambil products per chunk
	const chunkSize = 2;

	let productIndex = 0;

	// PURCHASE 1
	for (let i = 0; i < chunkSize; i++) {
		rows.push({
			id: randomUUID(),
			purchaseId: ctx.purchaseIds[0],
			productId: ctx.productIds[productIndex++],
		});
	}

	// PURCHASE 2
	for (let i = 0; i < chunkSize; i++) {
		rows.push({
			id: randomUUID(),
			purchaseId: ctx.purchaseIds[1],
			productId: ctx.productIds[productIndex++],
		});
	}

	// PURCHASE 3 (DIRECT SALES)
	for (let i = 0; i < chunkSize; i++) {
		rows.push({
			id: randomUUID(),
			purchaseId: ctx.purchaseIds[2],
			productId: ctx.productIds[productIndex++],
		});
	}

	await db.insert(purchaseItems).values(rows);

	return;
};
