import { db } from "@/db";
import {
	WarrantyCondInsertSchemaType,
	warrantyConditions,
} from "@/db/schemas/warranty_conditions.schema";
import crypto from "crypto";

export const seedWarrantyConditions = async (ctx: {
	productIds: string[];
	userId: string;
}) => {
	const rows: WarrantyCondInsertSchemaType[] = [];

	// hanya sebagian product punya warranty condition
	for (let i = 0; i < ctx.productIds.length; i++) {
		const productId = ctx.productIds[i];

		// simulasi: hanya 60% product yang sudah di-check
		if (i % 3 === 0) continue;

		const isRejected = i % 5 === 0;

		rows.push({
			id: crypto.randomUUID(),
			productId,
			condition: isRejected ? "rejected" : "valid",
			reason: isRejected ? "Found physical defect during inspection" : null,
			updatedBy: ctx.userId,
			updatedAt: new Date(),
		});
	}

	await db.insert(warrantyConditions).values(rows);

	return;
};
