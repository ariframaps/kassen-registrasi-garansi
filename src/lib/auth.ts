import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { magicLink } from "better-auth/plugins";

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
			console.log(ctx.path);
			if (ctx.path === "/email-otp/send-verification-otp") {
				const result = await db
					.select()
					.from(user)
					.where(eq(user.email, ctx.body?.email))
					.limit(1);
				if (!result[0]) {
					console.error("❌ Auth Error: User not found in DB");
					throw new APIError("NOT_FOUND", {
						message: "User not found",
					});
				}
				const findUser = userSchema.parse(result[0]);

				console.log("🔍 DB User Lookup Result:", findUser);

				if (
					findUser.status === "inactive" ||
					findUser.status === "deleted" ||
					!findUser.emailVerified
				) {
					console.error(`❌ Auth Error: User status is ${findUser.status}`);
					throw new APIError("UNAUTHORIZED", {
						message: "Invalid request",
					});
				}
				return;
			}
		}),
	},

	plugins: [
		// customSession(async ({ user, session }) => {
		// 	return {
		// 		user,
		// 		session,
		// 	};
		// }),

		emailOTP({
			sendVerificationOTP: async ({ email, otp, type }) => {
				console.log("➡️ sendVerificationOTP caught request for:", email);

				if (type === "sign-in") {
					console.log("📧 Attempting to send email via sendEmail...");
					await sendEmail({
						to: email,
						subject: "Your OTP Code",
						templateFileName: "otp",
						templateVariables: {
							otp,
							expiresIn: authConfig.OTP_EXPIRES_IN / 60,
						},
					});
				}
			},
			otpLength: 6,
			expiresIn: authConfig.OTP_EXPIRES_IN, //The expiry time of the OTP in seconds. Defaults to 300 seconds.
			disableSignUp: true,
			allowedAttempts: authConfig.OTP_FAILED_ATTEMPTS_LIMIT,
			storeOTP: "hashed",
		}),

		magicLink({
			sendMagicLink: async ({ email, token, url, metadata }, ctx) => {
				// Coba query user details untuk context yang lebih rich
				try {
					const result = await db
						.select()
						.from(user)
						.where(eq(user.email, email))
						.limit(1);

					if (result[0]) {
						const userData = userSchema.parse(result[0]);
						await sendEmail({
							to: email,
							subject: "Verifikasi Email - Akun Anda di Kassen Warranty",
							templateFileName: "user-invitation",
							templateVariables: {
								name: userData.name,
								email: userData.email,
								role: userData.role,
								verificationLink: url,
								expiresIn: String(authConfig.MAGIC_LINK_EXPIRES / 60),
							},
						});
						return;
					}
				} catch (err) {
					console.warn("⚠️ Failed to query user details in sendMagicLink callback:", err);
				}

				// Fallback ke template generic
				await sendEmail({
					to: email,
					subject: "Verifikasi Email Anda",
					templateFileName: "email-verification",
					templateVariables: {
						url,
						expiresIn: String(authConfig.MAGIC_LINK_EXPIRES / 60),
					},
				});
			},
			expiresIn: authConfig.MAGIC_LINK_EXPIRES,
			disableSignUp: true,
			storeToken: "hashed",
		}),
	],
});

const additionalFields = {
	role: {
		type: userRole,
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
};
