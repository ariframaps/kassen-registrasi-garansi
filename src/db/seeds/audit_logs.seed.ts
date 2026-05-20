import { db } from "@/db";
import { auditLogs } from "@/db/schemas/audit_logs.schema";
import crypto from "crypto";

export const seedAuditLogs = async (ctx: { userIds: string[] }) => {
	const now = new Date();

	await db.insert(auditLogs).values([
		// AUTH SUCCESS
		{
			id: crypto.randomUUID(),
			userId: ctx.userIds[0],
			category: "AUTH",
			event: "LOGIN_SUCCESS",
			status: "success",
			priority: "low",
			ipAddress: "127.0.0.1",
			userAgent: "Mozilla/5.0",
			data: { method: "otp" },
			errorMessage: null,
			createdAt: now,
		},

		// PRODUCT EVENT
		{
			id: crypto.randomUUID(),
			userId: ctx.userIds[1],
			category: "PRODUCT",
			event: "PRODUCT_ASSIGNED",
			status: "success",
			priority: "medium",
			ipAddress: "127.0.0.1",
			userAgent: "PostmanRuntime",
			data: {
				serialNumber: "SN-001",
				action: "assigned_to_purchase",
			},
			errorMessage: null,
			createdAt: new Date(now.getTime() - 1000 * 60 * 10),
		},

		// ERROR EVENT
		{
			id: crypto.randomUUID(),
			userId: null,
			category: "SYSTEM",
			event: "UPLOAD_FAILED",
			status: "error",
			priority: "high",
			ipAddress: "127.0.0.1",
			userAgent: "API",
			data: { reason: "invalid file hash" },
			errorMessage: "Duplicate file detected",
			createdAt: new Date(now.getTime() - 1000 * 60 * 30),
		},
	]);

	return;
};
