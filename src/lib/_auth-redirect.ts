"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "./auth-client";

const publicRoutes = ["/login", "/check"];

export function AuthRedirect() {
	const router = useRouter();
	const pathname = usePathname();
	const { data: session, isPending } = authClient.useSession();

	useEffect(() => {
		if (!isPending && !session && !publicRoutes.includes(pathname)) {
			router.replace("/login");
		}
	}, [session, isPending, pathname]);

	return null;
}
