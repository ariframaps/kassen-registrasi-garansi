import { createAuthClient } from "better-auth/react";
import {
	emailOTPClient,
	inferAdditionalFields,
	magicLinkClient,
} from "better-auth/client/plugins";
import { auth } from "./auth";
import { envClient } from "./env-client";

export const authClient = createAuthClient({
	/** The base URL of the server (optional if you're using the same domain) */
	baseURL: process.env.NEXT_PUBLIC_BASE_URL,

	plugins: [
		emailOTPClient(),
		magicLinkClient(),
		inferAdditionalFields<typeof auth>(),
	],
});
