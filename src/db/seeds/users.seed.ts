import { randomUUID } from "crypto";
import { db } from "@/db";
import { users } from "../schemas/users.schema";

export const seedUsers = async () => {
	// fixed IDs biar bisa dipakai di seed lain
	const userIds = Array.from({ length: 7 }, () => randomUUID());

	const adminId = userIds[0];
	const salesId = userIds[1];
	const techId = userIds[2];

	// 4 dealer users
	const dealerIds = userIds.slice(3, 7);

	await db.insert(users).values([
		// ADMIN
		{
			id: adminId,
			name: "Admin System",
			email: "admin@system.com",
			role: "admin",
			status: "active",
		},

		// SALES
		{
			id: salesId,
			name: "Sales User",
			email: "sales@system.com",
			role: "sales",
			status: "active",
		},

		// TECH SUPPORT
		{
			id: techId,
			name: "Technical Support",
			email: "tech@system.com",
			role: "technical_support",
			status: "active",
		},

		// DEALERS (4 USERS)
		{
			id: dealerIds[0],
			name: "Dealer Alpha",
			email: "dealer.alpha@system.com",
			role: "dealer",
			status: "active",
		},
		{
			id: dealerIds[1],
			name: "Dealer Beta",
			email: "dealer.beta@system.com",
			role: "dealer",
			status: "active",
		},
		{
			id: dealerIds[2],
			name: "Dealer Gamma",
			email: "dealer.gamma@system.com",
			role: "dealer",
			status: "active",
		},
		{
			id: dealerIds[3],
			name: "Dealer Delta",
			email: "dealer.delta@system.com",
			role: "dealer",
			status: "active",
		},
	]);

	// return IDs biar bisa dipakai seed lain
	return {
		adminId,
		salesId,
		techId,
		dealerIds,
		allUserIds: [adminId, salesId, techId, ...dealerIds],
	};
};
