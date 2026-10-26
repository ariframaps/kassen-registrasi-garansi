import { config } from "dotenv";
import { expand } from "dotenv-expand";
import { z, ZodError } from "zod";

const serverEnvSchema = z.object({
	NODE_ENV: z.string().min(1),
	BETTER_AUTH_SECRET: z.string().min(1),
	BETTER_AUTH_URL: z.string().min(1),
	DATABASE_URL: z.string().min(1),
	SMTP_HOST: z.string().min(1),
	SMTP_USER: z.string().min(1),
	SMTP_PASS: z.string().min(1),
	SMTP_SECURE: z.string(),
	SMTP_PORT: z.string().min(1),
	GOOGLE_DRIVE_CLIENT_ID: z.string().min(1),
	GOOGLE_DRIVE_CLIENT_SECRET: z.string().min(1),
	GOOGLE_DRIVE_ACCESS_TOKEN: z.string().min(1),
	GOOGLE_DRIVE_REFRESH_TOKEN: z.string().min(1),
	GOOGLE_DRIVE_FOLDER_ID: z.string().min(1),
	RESEND_API_KEY: z.string().min(1),
});

expand(config());

try {
	serverEnvSchema.parse(process.env);
} catch (e) {
	if (e instanceof ZodError) {
		console.error("Environment validation error:", e.issues);
	}
}

export const envServer = serverEnvSchema.parse(process.env);
