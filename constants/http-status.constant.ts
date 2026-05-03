export const HTTP_STATUS = {
	OK: {
		code: 200,
		message: "Success",
	},
	CREATED: {
		code: 201,
		message: "Resource created successfully",
	},
	NO_CONTENT: {
		code: 204,
		message: "Success (no content)",
	},
	BAD_REQUEST: {
		code: 400,
		message: "Bad Request",
	},
	UNAUTHORIZED: {
		code: 401,
		message: "Unauthorized",
	},
	FORBIDDEN: {
		code: 403,
		message: "Forbidden",
	},
	NOT_FOUND: {
		code: 404,
		message: "Not Found",
	},
	CONFLICT: {
		code: 409,
		message: "Conflict",
	},
	UNPROCESSABLE_ENTITY: {
		code: 422,
		message: "Unprocessable Entity",
	},
	TOO_MANY_REQUESTS: {
		code: 429,
		message: "Too Many Requests",
	},
	INTERNAL_SERVER_ERROR: {
		code: 500,
		message: "Internal Server Error",
	},
} as const;
