import { envClient } from "./lib/env-client";
import { envServer } from "./lib/env-server";
import { transporter } from "./lib/nodemailer";

async function main() {
	try {
		// nodemailer
		await transporter.verify();
		console.log("Server is ready to take our messages");

		// env
		const envs = {
			envServer,
			envClient,
		};

		if (envs) console.log("Env is ready.");
	} catch (err) {
		console.error("Verification failed:", err);
	}
}

main();
