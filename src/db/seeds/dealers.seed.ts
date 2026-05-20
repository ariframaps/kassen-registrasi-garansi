import { db } from "@/db";
import { dealers } from "@/db/schemas/dealers.schema";
import { randomUUID } from "crypto";

export const seedDealers = async (dealerUserIds: string[]) => {
	const dealerIds = Array.from({ length: 4 }, () => randomUUID());

	await db.insert(dealers).values([
		{
			id: dealerIds[0],
			userId: dealerUserIds[0],
			name: "Dealer Alpha Group",
			email: "dealer.alpha@system.com",
			phone: "081234567890",
			address: "Jakarta",
			status: "active",
		},
		{
			id: dealerIds[1],
			userId: dealerUserIds[1],
			name: "Dealer Beta Group",
			email: "dealer.beta@system.com",
			phone: "081234567891",
			address: "Bandung",
			status: "active",
		},
		{
			id: dealerIds[2],
			userId: dealerUserIds[2],
			name: "Dealer Gamma Group",
			email: "dealer.gamma@system.com",
			phone: "081234567892",
			address: "Surabaya",
			status: "active",
		},
		{
			id: dealerIds[3],
			userId: dealerUserIds[3],
			name: "Dealer Delta Group",
			email: "dealer.delta@system.com",
			phone: "081234567893",
			address: "Bali",
			status: "active",
		},
	]);

	return dealerIds;
};
