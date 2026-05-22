import { NormalizedError } from "../errors/normalize-error";

const SENSITIVE_PATTERNS = [
	/@.+\..+/, // email
	/password/i,
	/token/i,
	/secret/i,
	/sql/i,
	/insert|update|delete|select/i,
];

function isSensitive(text: string) {
	return SENSITIVE_PATTERNS.some((pattern) => pattern.test(text));
}

export function getSafeErrorMessage(error: NormalizedError) {
	const first = error.issues[0] || "Unknown error";

	if (isSensitive(first)) {
		return `[${error.type}] error occurred. Please try again.`;
	}

	return first;
}
