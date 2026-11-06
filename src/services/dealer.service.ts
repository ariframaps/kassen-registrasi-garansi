import { HTTP_STATUS } from "@/constants/http-status.constant";
import { db } from "@/db";
import { auditLog, customer, user } from "@/db/schema";
import { HttpError } from "@/lib/api/http-error";
import { and, eq, isNull } from "drizzle-orm";
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

export const dealerUpdateSchema = z.object(dealerFormFields);
export type DealerUpdatePayload = z.infer<typeof dealerUpdateSchema>;

interface AuditContext {
	userId: string;
	ipAddress?: string | null;
	userAgent?: string | null;
}

// A "dealer" is a `user` with role "dealer". The user table has no phone/address,
// so those come from the optional `customer` profile linked via customer.userId.
type DealerUser = typeof user.$inferSelect;
type DealerProfile = {
	phone: string | null;
	address: string | null;
} | null;

function toDealer(u: DealerUser, profile: DealerProfile): Dealer {
	return {
		id: u.id,
		name: u.name,
		email: u.email,
		phone: profile?.phone ?? undefined,
		address: profile?.address ?? undefined,
		status: u.status === "active" ? "active" : "inactive",
		created_at: u.createdAt.toISOString(),
		updated_at: u.updatedAt.toISOString(),
	};
}

async function findDealerUser(id: string) {
	const found = await db.query.user.findFirst({
		where: and(eq(user.id, id), eq(user.role, "dealer")),
	});
	if (!found)
		throw new HttpError("Dealer tidak ditemukan", HTTP_STATUS.NOT_FOUND.code);
	return found;
}

export const dealerService = {
	getAll: async (): Promise<Dealer[]> => {
		const rows = await db
			.select({
				user,
				profileId: customer.id,
				phone: customer.phone,
				address: customer.address,
			})
			.from(user)
			.leftJoin(customer, eq(customer.userId, user.id))
			.where(and(eq(user.role, "dealer"), isNull(user.deletedAt)));

		// Lazy-create the DEALER customer profile for legacy dealer users that have none.
		const missing = rows.filter((r) => r.profileId === null);
		if (missing.length > 0) {
			await db
				.insert(customer)
				.values(
					missing.map((r) => ({
						id: crypto.randomUUID(),
						customId: generateAutoCustomId(),
						userId: r.user.id,
						type: "DEALER" as const,
						name: r.user.name,
						email: r.user.email,
					})),
				)
				.onConflictDoNothing();
		}

		return rows.map((r) =>
			toDealer(r.user, { phone: r.phone, address: r.address }),
		);
	},

	update: async (
		id: string,
		data: DealerUpdatePayload,
		audit: AuditContext,
	): Promise<Dealer> => {
		await findDealerUser(id);

		const [updatedUser] = await db
			.update(user)
			.set({ name: data.name, updatedAt: new Date() })
			.where(eq(user.id, id))
			.returning();

		if (!updatedUser)
			throw new HttpError(
				"Gagal memperbarui dealer",
				HTTP_STATUS.BAD_GATEWAY.code,
			);

		// Email lives on better-auth's user row and is changed via the
		// change-email flow; only profile fields are updated here.
		const [profile] = await db
			.update(customer)
			.set({
				name: data.name,
				phone: data.phone ?? null,
				address: data.address ?? null,
				updatedAt: new Date(),
			})
			.where(eq(customer.userId, id))
			.returning();

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

		return toDealer(updatedUser, profile ?? null);
	},

	toggleStatus: async (
		id: string,
		audit: AuditContext,
	): Promise<Dealer> => {
		const current = await findDealerUser(id);

		if (current.deletedAt)
			throw new HttpError(
				"Dealer tidak bisa diaktifkan karena User yang bersangkutan sudah tidak ada/dihapus",
				HTTP_STATUS.BAD_REQUEST.code,
			);

		const newStatus = current.status === "active" ? "inactive" : "active";

		await db
			.update(user)
			.set({ status: newStatus, updatedAt: new Date() })
			.where(eq(user.id, current.id));

		const profile = await db.query.customer.findFirst({
			where: eq(customer.userId, id),
		});

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

		return toDealer({ ...current, status: newStatus }, profile ?? null);
	},
};
