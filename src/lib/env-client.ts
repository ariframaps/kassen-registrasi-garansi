import z from "zod";

function getClientEnv() {
	const env = {
		// Next.js (client)
    	NEXT_PUBLIC_BASE_URL: z.string().min(1),
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

export const envClient = getClientEnv();
