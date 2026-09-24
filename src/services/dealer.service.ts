import { HTTP_STATUS } from "@/constants/http-status.constant";
import { db } from "@/db";
import { auditLog, customer, user } from "@/db/schema";
import { HttpError } from "@/lib/api/http-error";
import { and, eq, isNotNull } from "drizzle-orm";
import z from "zod";
import crypto from "crypto";
import type { Dealer } from "@/types";
import { generateAutoCustomId } from "./customer.service";

const dealerFormFields = {
	name: z.string().min(1, "Nama wajib diisi"),
	email: z.string().email("Format email tidak valid"),
	phone: z
		.string()
		.max(50)
		.nullable()
		.optional()
		.transform((v) => (v === "" ? null : v)),
	address: z
		.string()
		.nullable()
		.optional()
		.transform((v) => (v === "" ? null : v)),
};

export const addDealerSchema = z.object(dealerFormFields);
export type AddDealerPayload = z.infer<typeof addDealerSchema>;

export const dealerUpdateSchema = z.object(dealerFormFields);
export type DealerUpdatePayload = z.infer<typeof dealerUpdateSchema>;

interface AuditContext {
	userId: string;
	ipAddress?: string | null;
	userAgent?: string | null;
}

// A "dealer" is a `customer` row with a linked dashboard login (userId set).
// Since `customer` has no status column, active/inactive is tracked on the linked `user`.
function toDealer(
	row: {
		id: string;
		name: string;
		email: string | null;
		phone: string | null;
		address: string | null;
		createdAt: Date;
		updatedAt: Date;
	},
	userStatus: "active" | "inactive" | "deleted",
): Dealer {
	return {
		id: row.id,
		name: row.name,
		email: row.email ?? "",
		phone: row.phone ?? undefined,
		address: row.address ?? undefined,
		status: userStatus === "active" ? "active" : "inactive",
		created_at: row.createdAt.toISOString(),
		updated_at: row.updatedAt.toISOString(),
	};
}

export const dealerService = {
	getAll: async (): Promise<Dealer[]> => {
		const rows = await db.query.customer.findMany({
			where: isNotNull(customer.userId),
			with: { user: true },
		});

		return rows.filter((r) => r.user).map((r) => toDealer(r, r.user!.status));
	},

	add: async (
		data: AddDealerPayload,
		audit: AuditContext,
	): Promise<Dealer> => {
		const existingUser = await db.query.user.findFirst({
			where: eq(user.email, data.email),
		});
		if (existingUser)
			throw new HttpError(
				"Email sudah terdaftar",
				HTTP_STATUS.CONFLICT.code,
			);

		const newUserId = crypto.randomUUID();
		await db.insert(user).values({
			id: newUserId,
			name: data.name,
			email: data.email,
			emailVerified: false,
			role: "dealer",
			status: "active",
		});

		const result = await db
			.insert(customer)
			.values({
				id: crypto.randomUUID(),
				customId: generateAutoCustomId(),
				userId: newUserId,
				name: data.name,
				email: data.email,
				phone: data.phone ?? null,
				address: data.address ?? null,
			})
			.returning();

		if (!result[0])
			throw new HttpError(
				"Gagal menambahkan dealer",
				HTTP_STATUS.BAD_GATEWAY.code,
			);

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: audit.userId,
			category: "DEALER",
			event: "DEALER_ADDED",
			status: "success",
			priority: "medium",
			ipAddress: audit.ipAddress ?? undefined,
			userAgent: audit.userAgent ?? undefined,
			data: { dealerId: result[0].id, name: data.name, email: data.email },
		});

		return toDealer(result[0], "active");
	},

	update: async (
		id: string,
		data: DealerUpdatePayload,
		audit: AuditContext,
	): Promise<Dealer> => {
		const existing = await db.query.customer.findFirst({
			where: and(eq(customer.id, id), isNotNull(customer.userId)),
			with: { user: true },
		});
		if (!existing || !existing.user)
			throw new HttpError(
				"Dealer tidak ditemukan",
				HTTP_STATUS.NOT_FOUND.code,
			);

		const result = await db
			.update(customer)
			.set({
				name: data.name,
				email: data.email,
				phone: data.phone ?? null,
				address: data.address ?? null,
				updatedAt: new Date(),
			})
			.where(eq(customer.id, id))
			.returning();

		if (!result[0])
			throw new HttpError(
				"Gagal memperbarui dealer",
				HTTP_STATUS.BAD_GATEWAY.code,
			);

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: audit.userId,
			category: "DEALER",
			event: "DEALER_UPDATED",
			status: "success",
			priority: "medium",
			ipAddress: audit.ipAddress ?? undefined,
			userAgent: audit.userAgent ?? undefined,
			data: { dealerId: id, changes: data },
		});

		return toDealer(result[0], existing.user.status);
	},

	toggleStatus: async (
		id: string,
		audit: AuditContext,
	): Promise<Dealer> => {
		const current = await db.query.customer.findFirst({
			where: and(eq(customer.id, id), isNotNull(customer.userId)),
			with: { user: true },
		});
		if (!current || !current.user)
			throw new HttpError(
				"Dealer tidak ditemukan",
				HTTP_STATUS.NOT_FOUND.code,
			);

		if (current.user.deletedAt)
			throw new HttpError(
				"Dealer tidak bisa diaktifkan karena User yang bersangkutan sudah tidak ada/dihapus",
				HTTP_STATUS.BAD_REQUEST.code,
			);

		const newStatus = current.user.status === "active" ? "inactive" : "active";

		await db
			.update(user)
			.set({ status: newStatus, updatedAt: new Date() })
			.where(eq(user.id, current.user.id));

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: audit.userId,
			category: "DEALER",
			event: "DEALER_STATUS_TOGGLED",
			status: "success",
			priority: "high",
			ipAddress: audit.ipAddress ?? undefined,
			userAgent: audit.userAgent ?? undefined,
			data: { dealerId: id, previousStatus: current.user.status, newStatus },
		});

		return toDealer(current, newStatus);
	},
};
