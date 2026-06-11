// components/auth-guard.tsx
"use client";

import { authClient } from "@/lib/auth-client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Loading from "@/components/ui/loading";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
	const router = useRouter();
  const pathName = usePathname()

	const { data: session, isPending } = authClient.useSession();

  	const isPublicPage = pathName === "/login" || pathName === "/check";


	useEffect(() => {
		if (!isPending && !session && !isPublicPage) {
			router.replace("/login");
		}
	}, [isPending, session, router, pathName]);

	if (isPending) {
		return (
			<div className="fixed inset-0 flex items-center justify-center">
				<Loading />
			</div>
		);
	}

  	if (!session && isPublicPage) {
		return <>{children}</>;
	}

	if (!session) return null;

	return <>{children}</>;
}
