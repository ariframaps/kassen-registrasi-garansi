"server-only";

export function getServerEnv() {
	const env = {
		// Server-side only
		RESEND_OTP_TIMEOUT: process.env.RESEND_OTP_TIMEOUT,
	};

	const missingVars = Object.entries(env)
		.filter(([_, value]) => !value)
		.map(([key]) => key);

	if (missingVars.length > 0) {
		throw new Error(
			`Missing environment variables, :\n${missingVars.join("\n")}`,
		);
	}

	return env;
}

export const serverEnv = getServerEnv();
