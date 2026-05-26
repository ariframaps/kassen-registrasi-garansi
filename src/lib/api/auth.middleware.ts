import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { UserRole } from "@/types";

type Session = typeof auth.$Infer.Session;

export const authenticationMiddleware = async (): Promise<Session> => {
	const session = await auth.api.getSession({
		headers: await headers(), // you need to pass the headers object.
	});

	if (session && session.user && session.session) return session;
	else {
		console.error("UNAUTHORIZED");
		throw new Error("Unauthorized");
	}
};

export const authorizationMiddleware = async ({
	allowedRole,
	currentRole,
}: {
	allowedRole: UserRole[];
	currentRole: string;
}): Promise<void> => {
	const isRoleAllowed = allowedRole.find(
		(r) => r.toLowerCase() === currentRole.toLowerCase(),
	);

	if (isRoleAllowed) return;
	else {
		console.error("access denied role Unauthorized");
		throw new Error("Access Denied");
	}
};
