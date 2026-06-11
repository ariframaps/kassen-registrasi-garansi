import { createAuthClient } from "better-auth/react";
import {
	emailOTPClient,
	inferAdditionalFields,
	magicLinkClient,
} from "better-auth/client/plugins";
import { auth } from "./auth";

export const authClient = createAuthClient({
	/** The base URL of the server (optional if you're using the same domain) */
	baseURL: "https://vercel.com/ariframaps-projects",

	plugins: [
		emailOTPClient(),
		magicLinkClient(),
		inferAdditionalFields<typeof auth>(),
	],
});
