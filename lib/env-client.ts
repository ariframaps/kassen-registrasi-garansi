export function getClientEnv() {
	const env = {
		// Next.js (client + server)
		NEXT_PUBLIC_RESEND_OTP_TIMEOUT: process.env.NEXT_PUBLIC_RESEND_OTP_TIMEOUT,
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

export const clientEnv = getClientEnv();
