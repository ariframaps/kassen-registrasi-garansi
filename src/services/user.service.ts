import { HTTP_STATUS } from "@/constants/http-status.constant";
import { db } from "@/db";
import {
	user,
	userSchema,
	UserSchema,
	customer,
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

export const addUserSchema = z.object({
	...userFormFields,
	customerId: z.string().trim().min(1).optional().nullable(),
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
				if (!data.customerId) {
					throw new HttpError(
						"Pilih dealer yang akan ditautkan",
						HTTP_STATUS.BAD_REQUEST.code,
					);
				}

				const existingCustomer = await tx.query.customer.findFirst({
					where: eq(customer.id, data.customerId),
				});
				if (!existingCustomer)
					throw new HttpError(
						"Dealer tidak ditemukan",
						HTTP_STATUS.NOT_FOUND.code,
					);
				if (existingCustomer.userId)
					throw new HttpError(
						"Dealer ini sudah ditautkan ke user lain",
						HTTP_STATUS.CONFLICT.code,
					);

				await tx
					.update(customer)
					.set({ userId: newUserId, updatedAt: new Date() })
					.where(eq(customer.id, data.customerId));
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

		// Kirim email undangan set password via Better Auth API Server
		try {
			await auth.api.requestPasswordReset({
				body: {
					email: data.email,
					redirectTo: "/reset-password",
				},
				headers: await headers(),
			});
		} catch (passwordResetError) {
			console.warn(
				"⚠️ Email set password gagal dikirim, tapi user sudah dibuat:",
				passwordResetError,
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
			// Kirim ulang email set password via Better Auth API Server
			await auth.api.requestPasswordReset({
				body: {
					email: existing.email,
					redirectTo: "/reset-password",
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

		if (data.newEmail === existing.email)
			throw new HttpError(
				"Email baru harus berbeda dari email saat ini",
				HTTP_STATUS.BAD_REQUEST.code,
			);

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
			const dealerRecord = await db.query.customer.findFirst({
				where: eq(customer.userId, id),
			});
			if (dealerRecord) {
				await db
					.update(customer)
					.set({
						email: data.newEmail,
						updatedAt: new Date(),
					})
					.where(eq(customer.userId, id));
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
			// Kirim email verifikasi untuk email baru (tanpa headers, agar tidak
			// terdeteksi sebagai sesi admin yang mengubah email user lain)
			await auth.api.sendVerificationEmail({
				body: {
					email: data.newEmail,
					callbackURL: "/login",
				},
			});
		} catch (verificationError) {
			console.warn("⚠️ Email verifikasi gagal dikirim:", verificationError);
		}

		const parsed = userSchema.parse(result[0]);
		return parsed;
	},
};
