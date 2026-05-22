import { ZodError } from "zod";
import { NormalizedError } from "../normalize-error";

export function zodAdapter(error: ZodError): NormalizedError {
	return {
		type: "validation",
		issues: error.issues.map((i) => i.message),
		details: error.issues,
	};
}
