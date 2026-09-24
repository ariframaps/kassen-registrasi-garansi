export const authConfig = {
	// better auth rate limit
	RATE_LIMIT_MAX_REQUEST: 15,
	RATE_LIMIT_TIME_WINDOW: 30,

	// better auth password reset
	RESET_PASSWORD_TOKEN_EXPIRES_IN: 3600, // 1 HOUR

	// better auth sessions
	SESSION_EXPIRY: 60 * 60 * 24 * 7, // 7 DAYS
	SESSION_UPDATE_AGE: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
	SESSION_FRESH_AGE: 60 * 0, // 0 minutes = DISABLED
};
