import { HTTP_STATUS } from "@/constants/http-status.constant";
import { db } from "@/db";
import { auditLog, dealers, dealerSchema, DealerSchema, user } from "@/db/schema";
import { HttpError } from "@/lib/api/http-error";
import { eq } from "drizzle-orm";
import z from "zod";
import crypto from "crypto";

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

export const dealerService = {
	getAll: async (): Promise<DealerSchema[]> => {
		const result = await db.query.dealers.findMany({});
		return dealerSchema.array().parse(result);
	},

	add: async (
		data: AddDealerPayload,
		audit: AuditContext,
	): Promise<DealerSchema> => {
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
			.insert(dealers)
			.values({
				id: crypto.randomUUID(),
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

		const parsed = dealerSchema.parse(result[0]);

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: audit.userId,
			category: "DEALER",
			event: "DEALER_ADDED",
			status: "success",
			priority: "medium",
			ipAddress: audit.ipAddress ?? undefined,
			userAgent: audit.userAgent ?? undefined,
			data: { dealerId: parsed.id, name: parsed.name, email: parsed.email },
		});

		return parsed;
	},

	update: async (
		id: string,
		data: DealerUpdatePayload,
		audit: AuditContext,
	): Promise<DealerSchema> => {
		const existing = await db.query.dealers.findFirst({
			where: eq(dealers.id, id),
		});
		if (!existing)
			throw new HttpError(
				"Dealer tidak ditemukan",
				HTTP_STATUS.NOT_FOUND.code,
			);

		const result = await db
			.update(dealers)
			.set({
				name: data.name,
				email: data.email,
				phone: data.phone ?? null,
				address: data.address ?? null,
				updatedAt: new Date(),
			})
			.where(eq(dealers.id, id))
			.returning();

		if (!result[0])
			throw new HttpError(
				"Gagal memperbarui dealer",
				HTTP_STATUS.BAD_GATEWAY.code,
			);

		const parsed = dealerSchema.parse(result[0]);

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

		return parsed;
	},

	toggleStatus: async (
		id: string,
		audit: AuditContext,
	): Promise<DealerSchema> => {
		const current = await db.query.dealers.findFirst({
			where: eq(dealers.id, id),
		});
		if (!current)
			throw new HttpError(
				"Dealer tidak ditemukan",
				HTTP_STATUS.NOT_FOUND.code,
			);

		const relatedUser = await db.query.user.findFirst({
			where: eq(user.id, current.userId),
		});

		if (!relatedUser)
			throw new HttpError(
				"User terkait tidak ditemukan",
				HTTP_STATUS.NOT_FOUND.code,
			);

		if (relatedUser.deletedAt)
			throw new HttpError(
				"Dealer tidak bisa diaktifkan karena User yang bersangkutan sudah tidak ada/dihapus",
				HTTP_STATUS.BAD_REQUEST.code,
			);

		const newStatus = current.status === "active" ? "inactive" : "active";

		const result = await db
			.update(dealers)
			.set({ status: newStatus, updatedAt: new Date() })
			.where(eq(dealers.id, id))
			.returning();

		if (!result[0])
			throw new HttpError(
				"Gagal mengubah status dealer",
				HTTP_STATUS.BAD_GATEWAY.code,
			);

		await db
			.update(user)
			.set({ status: newStatus, updatedAt: new Date() })
			.where(eq(user.id, current.userId));

		const parsed = dealerSchema.parse(result[0]);

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: audit.userId,
			category: "DEALER",
			event: "DEALER_STATUS_TOGGLED",
			status: "success",
			priority: "high",
			ipAddress: audit.ipAddress ?? undefined,
			userAgent: audit.userAgent ?? undefined,
			data: { dealerId: id, previousStatus: current.status, newStatus },
		});

		return parsed;
	},
};
