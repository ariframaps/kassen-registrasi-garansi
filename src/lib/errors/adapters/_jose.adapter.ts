import { JWTClaimValidationFailed, JWTExpired, JWTInvalid } from "jose/errors";
import { NormalizedError } from "../normalize-error";

const jwtError = (issues: string[], details: unknown): NormalizedError => ({
	type: "jwt",
	issues,
	details,
});

export function joseAdapter(error: unknown): NormalizedError {
	if (!(error instanceof Error)) {
		return {
			type: "jwt",
			issues: ["Invalid token"],
			details: error,
		};
	}

	switch (error.constructor) {
		case JWTExpired:
			return jwtError(["Token has expired"], error);

		case JWTClaimValidationFailed:
			return jwtError(["Token claims are invalid"], error);

		case JWTInvalid:
			return jwtError(["Invalid or malformed token"], error);

		default:
			return jwtError(["Authentication failed"], error);
	}
}
