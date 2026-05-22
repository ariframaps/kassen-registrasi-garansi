import { HTTP_STATUS } from "@/constants/http-status.constant";
import { NormalizedError } from "../errors/normalize-error";

export function getHttpErrorStatus(error: NormalizedError) {
	switch (error.type) {
		case "validation":
			return HTTP_STATUS.BAD_REQUEST.code;

		case "auth":
			return HTTP_STATUS.UNAUTHORIZED.code;

		case "database":
			return HTTP_STATUS.INTERNAL_SERVER_ERROR.code;

		case "email":
			return HTTP_STATUS.BAD_GATEWAY.code;

		default:
			return HTTP_STATUS.INTERNAL_SERVER_ERROR.code;
	}
}
