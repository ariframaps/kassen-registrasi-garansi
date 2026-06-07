import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { UserRole } from "@/types";
import { HttpError } from "@/lib/api/http-error";

type Session = typeof auth.$Infer.Session;

export const authenticationMiddleware = async (): Promise<Session> => {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (session && session.user && session.session) return session;
	else {
		throw new HttpError("Unauthorized", 401);
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
		throw new HttpError("Access Denied", 403);
	}
};
