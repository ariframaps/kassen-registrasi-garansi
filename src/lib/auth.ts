import { betterAuth } from "better-auth";

import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db"; // your drizzle instance
import { envServer } from "./env-server";
import { authConfig } from "@/configs/auth.config";
import { sendEmail } from "./email";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { userRole } from "@/types";
import { user, userSchema } from "@/db/schema";
import { eq } from "drizzle-orm";

console.log("AUTH FILE LOADED");

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg", // or "mysql", "sqlite"
	}),

	trustedOrigins: [envServer.BETTER_AUTH_URL],

	advanced: {
		useSecureCookies: envServer.NODE_ENV === "production",
	},

	emailAndPassword: {
		enabled: true,
		disableSignUp: true,
		minPasswordLength: 8,
		requireEmailVerification: false,
		resetPasswordTokenExpiresIn: authConfig.RESET_PASSWORD_TOKEN_EXPIRES_IN,
		sendResetPassword: async ({ user, url }) => {
			await sendEmail({
				to: user.email,
				subject: "Atur Password Akun Anda",
				templateFileName: "user-invitation",
				templateVariables: {
					name: user.name,
					email: user.email,
					resetLink: url,
					expiresIn: String(authConfig.RESET_PASSWORD_TOKEN_EXPIRES_IN / 60),
				},
			});
		},
		onPasswordReset: async ({ user: resetUser }) => {
			await db
				.update(user)
				.set({ emailVerified: true, status: "active", updatedAt: new Date() })
				.where(eq(user.id, resetUser.id));
		},
	},

	emailVerification: {
		sendVerificationEmail: async ({ user, url }) => {
			await sendEmail({
				to: user.email,
				subject: "Verifikasi Email Baru Anda",
				templateFileName: "email-verification",
				templateVariables: {
					name: user.name,
					email: user.email,
					verificationLink: url,
				},
			});
		},
	},

	user: {
		changeEmail: {
			enabled: false,
		},
		deleteUser: {
			enabled: false,
		},

		additionalFields: {
			role: {
				type: [...userRole],
				required: true,
				defaultValue: "dealer",
				input: false,
			},

			status: {
				type: ["active", "inactive", "deleted"],
				required: true,
				defaultValue: "active",
				input: false,
			},

			lastLoginAt: {
				type: "date",
				required: false,
				input: false,
			},

			deletedAt: {
				type: "date",
				required: false,
				input: false,
			},
		},
	},

	rateLimit: {
		enabled: envServer.NODE_ENV === "production",
		window: authConfig.RATE_LIMIT_TIME_WINDOW, // time window in seconds
		max: authConfig.RATE_LIMIT_MAX_REQUEST, // max requests in the window
	},

	session: {
		expiresIn: authConfig.SESSION_EXPIRY,
		updateAge: authConfig.SESSION_UPDATE_AGE,
		freshAge: authConfig.SESSION_FRESH_AGE,
	},

	hooks: {
		before: createAuthMiddleware(async (ctx) => {
			if (ctx.path === "/sign-in/email") {
				const result = await db
					.select()
					.from(user)
					.where(eq(user.email, ctx.body?.email))
					.limit(1);
				if (!result[0]) {
					console.error("❌ Auth Error: User not found in DB");
					throw new APIError("UNAUTHORIZED", {
						message: "Email atau password salah",
					});
				}
				const findUser = userSchema.parse(result[0]);

				if (findUser.status === "inactive" || findUser.status === "deleted") {
					console.error(`❌ Auth Error: User status is ${findUser.status}`);
					throw new APIError("UNAUTHORIZED", {
						message: "Invalid request",
					});
				}
				return;
			}
		}),
	},
});
