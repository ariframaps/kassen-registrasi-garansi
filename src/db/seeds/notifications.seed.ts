import { db } from "@/db";
import { notifications } from "@/db/schemas/notifications.schema";
import crypto, { randomUUID } from "crypto";

export const seedNotifications = async (ctx: {
	userIds: string[];
	waitingListIds: string[];
}) => {
	await db.insert(notifications).values([
		// GENERAL NOTIFICATION
		{
			id: randomUUID(),
			userId: ctx.userIds[0],
			title: "System Maintenance",
			body: "System will be down at midnight for maintenance.",
			type: "general",
			relatedWaitingListId: null,
			isRead: false,
		},
		// PRODUCT READY NOTIFICATION
		{
			id: randomUUID(),
			userId: ctx.userIds[1],
			title: "Product Available",
			body: "Your requested serial number is now available.",
			type: "product_ready",
			relatedWaitingListId: ctx.waitingListIds[0],
			isRead: false,
		},
		// READ NOTIFICATION (UI TEST)
		{
			id: randomUUID(),
			userId: ctx.userIds[1],
			title: "Request Processed",
			body: "Your request has been processed by admin.",
			type: "product_ready",
			relatedWaitingListId: ctx.waitingListIds[1],
			isRead: true,
		},
	]);

	return;
};
