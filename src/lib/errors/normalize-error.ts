import { ZodError } from "zod";
import { DrizzleQueryError } from "drizzle-orm/errors";

import { zodAdapter } from "./adapters/zod.adapter";
import { drizzleAdapter } from "./adapters/drizzle.adapter";
import { nodemailerAdapter } from "./adapters/nodemailer.adapter";
import { unknownAdapter } from "./adapters/unknown.adapter";
// import { joseAdapter } from "./adapters/_jose.adapter";

export type ErrorType =
	| "validation"
	| "database"
	| "email"
	| "auth"
	| "jwt"
	| "unknown";

export type NormalizedError = {
	type: ErrorType;
	issues: string[];
	details?: unknown;
};

interface NodemailerError extends Error {
	code?: string;
}

export function normalizeError(error: unknown): NormalizedError {
	console.error("[System Error Log]:", error);

	if (error instanceof ZodError) {
		return zodAdapter(error);
	}

	if (error instanceof DrizzleQueryError) {
		return drizzleAdapter(error);
	}

	// if (error instanceof Error) {
	// 	const name = error.constructor?.name;

	// 	if (name.includes("JWT") || name.includes("JWS")) {
	// 		return joseAdapter(error);
	// 	}
	// }
	return unknownAdapter(error);
}
