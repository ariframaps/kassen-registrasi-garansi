import { db } from "../";
import { warrantyCondition } from "../schemas/warranty_condition.schema";
import { WARRANTY_PRODUCT_IDS } from "./seed-products";
import { USER_IDS } from "./seed-users";

function pad(n: number): string {
	return String(n).padStart(3, "0");
}

export async function seedWarrantyConditions() {
	console.log("🌱 Seeding warranty conditions...");

	const now = new Date();
	const updatedByUsers = [
		USER_IDS.techSupport1,
		USER_IDS.techSupport2,
		USER_IDS.admin,
	];

	// Distribute conditions: 30 valid, 5 rejected
	const conditions: (typeof warrantyCondition.$inferInsert)[] =
		WARRANTY_PRODUCT_IDS.map((productId, i) => {
			const isRejected = i >= WARRANTY_PRODUCT_IDS.length - 5; // last 5 are rejected

			return {
				id: `wc_${pad(i + 1)}`,
				productId,
				condition: isRejected ? ("rejected" as const) : ("valid" as const),
				reason: isRejected
					? [
							"Kerusakan akibat penggunaan tidak sesuai prosedur",
							"Terdapat bekas benturan fisik yang disengaja",
							"Modifikasi tidak resmi pada komponen internal",
							"Kerusakan akibat terkena cairan",
							"Garansi tidak berlaku karena pemakaian komersial berlebihan",
						][i % 5]
					: null,
				updatedBy: updatedByUsers[i % updatedByUsers.length],
				updatedAt: now,
			};
		});

	await db.insert(warrantyCondition).values(conditions).onConflictDoNothing();
	console.log(`✅ Seeded ${conditions.length} warranty conditions`);
}
