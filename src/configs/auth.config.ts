export const authConfig = {
	OTP_MAX_RESEND: 3,
	OTP_BLOCK_TIME: 45, // minutes

	// better auth rate limit
	RATE_LIMIT_MAX_REQUEST: 1,
	RATE_LIMIT_TIME_WINDOW: 30,

	// better auth otp
	OTP_EXPIRES_IN: 60 * 4, // 4 MINUTES
	OTP_FAILED_ATTEMPTS_LIMIT: 5, // max failed attempts before blocking

	// better auth magic link
	MAGIC_LINK_EXPIRES: 3600, // S

	// better auth sessions
	SESSION_EXPIRY: 60 * 60 * 24 * 7, // 7 DAYS
	SESSION_UPDATE_AGE: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
	SESSION_FRESH_AGE: 60 * 0, // 0 minutes = DISABLED
};
