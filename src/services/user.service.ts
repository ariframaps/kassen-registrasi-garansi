import { HTTP_STATUS } from "@/constants/http-status.constant";
import { db } from "@/db";
import {
	user,
	userSchema,
	UserSchema,
	dealers,
	dealerSchema,
	auditLog,
} from "@/db/schema";
import { HttpError } from "@/lib/api/http-error";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import z from "zod";
import crypto from "crypto";
import { headers } from "next/headers";

const userFormFields = {
	name: z.string().min(1, "Nama wajib diisi"),
	email: z.string().email("Format email tidak valid"),
	role: z.enum(["admin", "sales", "dealer", "technical_support"]),
};

const dealerFields = {
	dealerName: z
		.string()
		.min(1, "Nama perusahaan wajib diisi")
		.nullable()
		.optional(),
	dealerPhone: z
		.string()
		.max(50)
		.nullable()
		.optional()
		.transform((v) => (v === "" ? null : v)),
	dealerAddress: z
		.string()
		.nullable()
		.optional()
		.transform((v) => (v === "" ? null : v)),
};

export const addUserSchema = z.object({
	...userFormFields,
	...dealerFields,
});
export type AddUserPayload = z.infer<typeof addUserSchema>;

export const updateUserSchema = z.object({
	name: z.string().min(1, "Nama wajib diisi"),
	role: z.enum(["admin", "sales", "dealer", "technical_support"]),
	status: z.enum(["active", "inactive"]),
});
export type UpdateUserPayload = z.infer<typeof updateUserSchema>;

export const changeEmailSchema = z.object({
	newEmail: z.string().email("Format email tidak valid"),
});
export type ChangeEmailPayload = z.infer<typeof changeEmailSchema>;

interface AuditContext {
	userId: string;
	ipAddress?: string | null;
	userAgent?: string | null;
}

function getRoleLabel(role: string): string {
	const labels: Record<string, string> = {
		admin: "Admin",
		sales: "Sales",
		dealer: "Dealer",
		technical_support: "Technical Support",
	};
	return labels[role] || role;
}

export const userService = {
	getAll: async (): Promise<UserSchema[]> => {
		const result = await db.query.user.findMany({});
		const parsed = userSchema.array().parse(result);
		return parsed;
	},

	add: async (
		data: AddUserPayload,
		audit: AuditContext,
	): Promise<UserSchema> => {
		const existingUser = await db.query.user.findFirst({
			where: eq(user.email, data.email),
		});
		if (existingUser)
			throw new HttpError("Email sudah terdaftar", HTTP_STATUS.CONFLICT.code);

		const newUserId = crypto.randomUUID();

		// Insert user dan dealer (jika perlu) dalam satu transaction
		await db.transaction(async (tx) => {
			await tx.insert(user).values({
				id: newUserId,
				name: data.name,
				email: data.email,
				emailVerified: false,
				role: data.role,
				status: "active",
			});

			if (data.role === "dealer") {
				if (!data.dealerName) {
					throw new HttpError(
						"Nama perusahaan wajib diisi untuk dealer",
						HTTP_STATUS.BAD_REQUEST.code,
					);
				}

				await tx.insert(dealers).values({
					id: crypto.randomUUID(),
					userId: newUserId,
					name: data.dealerName,
					email: data.email,
					phone: data.dealerPhone ?? null,
					address: data.dealerAddress ?? null,
					status: "active",
				});
			}

			await tx.insert(auditLog).values({
				id: crypto.randomUUID(),
				userId: audit.userId,
				category: "USER",
				event: "USER_ADDED",
				status: "success",
				priority: "medium",
				ipAddress: audit.ipAddress ?? undefined,
				userAgent: audit.userAgent ?? undefined,
				data: {
					userId: newUserId,
					name: data.name,
					email: data.email,
					role: data.role,
				},
			});
		});

		const result = await db.query.user.findFirst({
			where: eq(user.id, newUserId),
		});

		if (!result)
			throw new HttpError("Gagal membuat user", HTTP_STATUS.BAD_GATEWAY.code);

		const parsed = userSchema.parse(result);

		// Trigger magic link via Better Auth API Server
		try {
			await auth.api.signInMagicLink({
				body: {
					email: data.email,
					callbackURL: "/",
				},
				headers: await headers(),
			});
		} catch (magicLinkError) {
			console.warn(
				"⚠️ Magic link gagal dikirim, tapi user sudah dibuat:",
				magicLinkError,
			);
		}

		return parsed;
	},

	update: async (
		id: string,
		data: UpdateUserPayload,
		audit: AuditContext,
	): Promise<UserSchema> => {
		const existing = await db.query.user.findFirst({
			where: eq(user.id, id),
		});
		if (!existing)
			throw new HttpError("User tidak ditemukan", HTTP_STATUS.NOT_FOUND.code);

		if (existing.deletedAt)
			throw new HttpError(
				"User ini sudah dihapus dan tidak bisa diubah statusnya",
				HTTP_STATUS.BAD_REQUEST.code,
			);

		const result = await db
			.update(user)
			.set({
				name: data.name,
				role: data.role,
				status: data.status,
				updatedAt: new Date(),
			})
			.where(eq(user.id, id))
			.returning();

		if (!result[0])
			throw new HttpError(
				"Gagal memperbarui user",
				HTTP_STATUS.BAD_GATEWAY.code,
			);

		if (existing.role === "dealer" || data.role === "dealer") {
			const dealerRecord = await db.query.dealers.findFirst({
				where: eq(dealers.userId, id),
			});

			if (dealerRecord) {
				await db
					.update(dealers)
					.set({
						status: data.status === "active" ? "active" : "inactive",
						updatedAt: new Date(),
					})
					.where(eq(dealers.userId, id));
			}
		}

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: audit.userId,
			category: "USER",
			event: "USER_UPDATED",
			status: "success",
			priority: "medium",
			ipAddress: audit.ipAddress ?? undefined,
			userAgent: audit.userAgent ?? undefined,
			data: {
				userId: id,
				changes: data,
			},
		});

		const parsed = userSchema.parse(result[0]);
		return parsed;
	},

	delete: async (id: string, audit: AuditContext): Promise<UserSchema> => {
		const existing = await db.query.user.findFirst({
			where: eq(user.id, id),
		});
		if (!existing)
			throw new HttpError("User tidak ditemukan", HTTP_STATUS.NOT_FOUND.code);

		const result = await db
			.update(user)
			.set({
				deletedAt: new Date(),
				status: "inactive",
				updatedAt: new Date(),
			})
			.where(eq(user.id, id))
			.returning();

		if (!result[0])
			throw new HttpError("Gagal menghapus user", HTTP_STATUS.BAD_GATEWAY.code);

		if (existing.role === "dealer") {
			const dealerRecord = await db.query.dealers.findFirst({
				where: eq(dealers.userId, id),
			});
			if (dealerRecord) {
				await db
					.update(dealers)
					.set({
						status: "inactive",
						updatedAt: new Date(),
					})
					.where(eq(dealers.userId, id));
			}
		}

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: audit.userId,
			category: "USER",
			event: "USER_DELETED",
			status: "success",
			priority: "high",
			ipAddress: audit.ipAddress ?? undefined,
			userAgent: audit.userAgent ?? undefined,
			data: {
				userId: id,
				userEmail: existing.email,
			},
		});

		const parsed = userSchema.parse(result[0]);
		return parsed;
	},

	toggleStatus: async (
		id: string,
		audit: AuditContext,
	): Promise<UserSchema> => {
		const existing = await db.query.user.findFirst({
			where: eq(user.id, id),
		});
		if (!existing)
			throw new HttpError("User tidak ditemukan", HTTP_STATUS.NOT_FOUND.code);

		if (existing.deletedAt)
			throw new HttpError(
				"User ini sudah dihapus dan tidak bisa diubah statusnya",
				HTTP_STATUS.BAD_REQUEST.code,
			);

		const newStatus = existing.status === "active" ? "inactive" : "active";

		const result = await db
			.update(user)
			.set({
				status: newStatus,
				updatedAt: new Date(),
			})
			.where(eq(user.id, id))
			.returning();

		if (!result[0])
			throw new HttpError(
				"Gagal mengubah status user",
				HTTP_STATUS.BAD_GATEWAY.code,
			);

		if (existing.role === "dealer") {
			await db
				.update(dealers)
				.set({
					status: newStatus === "active" ? "active" : "inactive",
					updatedAt: new Date(),
				})
				.where(eq(dealers.userId, id));
		}

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: audit.userId,
			category: "USER",
			event: "USER_STATUS_TOGGLED",
			status: "success",
			priority: "high",
			ipAddress: audit.ipAddress ?? undefined,
			userAgent: audit.userAgent ?? undefined,
			data: {
				userId: id,
				previousStatus: existing.status,
				newStatus,
			},
		});

		const parsed = userSchema.parse(result[0]);
		return parsed;
	},

	resendVerification: async (
		id: string,
		audit: AuditContext,
	): Promise<void> => {
		const existing = await db.query.user.findFirst({
			where: eq(user.id, id),
		});
		if (!existing)
			throw new HttpError("User tidak ditemukan", HTTP_STATUS.NOT_FOUND.code);

		try {
			// Trigger magic link via Better Auth API Server
			await auth.api.signInMagicLink({
				body: {
					email: existing.email,
					callbackURL: "/",
				},
				headers: await headers(),
			});

			await db.insert(auditLog).values({
				id: crypto.randomUUID(),
				userId: audit.userId,
				category: "USER",
				event: "VERIFICATION_RESENT",
				status: "success",
				priority: "low",
				ipAddress: audit.ipAddress ?? undefined,
				userAgent: audit.userAgent ?? undefined,
				data: { userId: id, email: existing.email },
			});
		} catch (error) {
			throw new HttpError(
				"Gagal mengirim email verifikasi",
				HTTP_STATUS.INTERNAL_SERVER_ERROR.code,
			);
		}
	},

	changeEmail: async (
		id: string,
		data: ChangeEmailPayload,
		audit: AuditContext,
	): Promise<UserSchema> => {
		const existing = await db.query.user.findFirst({
			where: eq(user.id, id),
		});
		if (!existing)
			throw new HttpError("User tidak ditemukan", HTTP_STATUS.NOT_FOUND.code);

		const existingEmail = await db.query.user.findFirst({
			where: eq(user.email, data.newEmail),
		});
		if (existingEmail)
			throw new HttpError("Email sudah terdaftar", HTTP_STATUS.CONFLICT.code);

		const result = await db
			.update(user)
			.set({
				email: data.newEmail,
				emailVerified: false,
				status: "active",
				updatedAt: new Date(),
			})
			.where(eq(user.id, id))
			.returning();

		if (!result[0])
			throw new HttpError("Gagal mengubah email", HTTP_STATUS.BAD_GATEWAY.code);

		if (existing.role === "dealer") {
			const dealerRecord = await db.query.dealers.findFirst({
				where: eq(dealers.userId, id),
			});
			if (dealerRecord) {
				await db
					.update(dealers)
					.set({
						email: data.newEmail,
						updatedAt: new Date(),
					})
					.where(eq(dealers.userId, id));
			}
		}

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: audit.userId,
			category: "USER",
			event: "EMAIL_CHANGED",
			status: "success",
			priority: "medium",
			ipAddress: audit.ipAddress ?? undefined,
			userAgent: audit.userAgent ?? undefined,
			data: {
				userId: id,
				previousEmail: existing.email,
				newEmail: data.newEmail,
			},
		});

		try {
			// Trigger magic link via Better Auth API Server untuk email baru
			await auth.api.signInMagicLink({
				body: {
					email: data.newEmail,
					callbackURL: "/",
				},
				headers: await headers(),
			});
		} catch (magicLinkError) {
			console.warn("⚠️ Magic link gagal dikirim:", magicLinkError);
		}

		const parsed = userSchema.parse(result[0]);
		return parsed;
	},
};
