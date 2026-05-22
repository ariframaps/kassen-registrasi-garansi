import { NormalizedError } from "../normalize-error";

export function unknownAdapter(error: unknown): NormalizedError {
	if (error instanceof Error) {
		return {
			type: "unknown",
			issues: [error.message],
			details: error,
		};
	}

	return {
		type: "unknown",
		issues: ["Terjadi kesalahan internal server."],
		details: error,
	};
}
