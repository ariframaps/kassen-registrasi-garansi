import { db } from "@/db";
import { purchases } from "@/db/schemas/purchases.schema";
import crypto, { randomUUID } from "crypto";

export const seedPurchases = async (ctx: {
	customerIds: string[];
	dealerIds: string[];
	userId: string;
}) => {
	const purchaseIds = Array.from({ length: 3 }, () => randomUUID());

	await db.insert(purchases).values([
		// DEALER PURCHASE
		{
			id: purchaseIds[0],
			purchaseDate: "2026-01-10",
			customerId: ctx.customerIds[0],
			dealerId: ctx.dealerIds[0],
			registeredBy: ctx.userId,
			source: "dealer",
			notes: "Purchase via dealer Alpha",
		},

		// DEALER PURCHASE
		{
			id: purchaseIds[1],
			purchaseDate: "2026-01-15",
			customerId: ctx.customerIds[1],
			dealerId: ctx.dealerIds[1],
			registeredBy: ctx.userId,
			source: "dealer",
			notes: "Purchase via dealer Beta",
		},

		// DIRECT SALES
		{
			id: purchaseIds[2],
			purchaseDate: "2026-01-20",
			customerId: ctx.customerIds[0],
			dealerId: null,
			registeredBy: ctx.userId,
			source: "direct_sales",
			notes: "Direct sales from admin",
		},
	]);

	return purchaseIds;
};
