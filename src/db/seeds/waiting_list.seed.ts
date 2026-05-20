import { db } from "@/db";
import { waitingList } from "@/db/schemas/waiting_list.schema";
import crypto, { randomUUID } from "crypto";

export const seedWaitingList = async (ctx: {
	dealerIds: string[];
	userId: string;
	productIds: string[];
}) => {
	const waitingListIds = Array.from({ length: 3 }, () => randomUUID());

	await db.insert(waitingList).values([
		// END USER REQUESTS
		{
			id: waitingListIds[0],
			serialNumberRequested: "POS-UNKNOWN-001",
			requesterType: "end_user",
			requesterName: "Budi Santoso",
			requesterEmail: "budi@mail.com",
			requesterPhone: "08123456789",
			productId: null,
			dealerId: null,
			status: "pending",
			notifiedAt: null,
			resolvedAt: null,
			notifiedBy: null,
		},
		// DEALER REQUEST
		{
			id: waitingListIds[1],
			serialNumberRequested: "SCN-UNKNOWN-XYZ",
			requesterType: "dealer",
			requesterName: null,
			requesterEmail: null,
			requesterPhone: null,
			dealerId: ctx.dealerIds[0],
			productId: null,
			status: "pending",
			notifiedAt: null,
			resolvedAt: null,
			notifiedBy: null,
		},
		// RESOLVED CASE (FOUND PRODUCT)
		{
			id: waitingListIds[2],
			serialNumberRequested: "POS-FOUND-123",
			requesterType: "end_user",
			requesterName: "Siti Aminah",
			requesterEmail: "siti@mail.com",
			requesterPhone: "08111111111",
			dealerId: ctx.dealerIds[1],
			productId: ctx.productIds[0],
			status: "notified",
			notifiedAt: new Date(),
			resolvedAt: new Date(),
			notifiedBy: ctx.userId,
		},
	]);

	return waitingListIds;
};
