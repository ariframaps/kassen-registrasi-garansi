// components/auth-guard.tsx
"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Loading from "@/components/ui/loading";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
	const router = useRouter();

	const { data: session, isPending } = authClient.useSession();

	useEffect(() => {
		if (!isPending && !session) {
			router.replace("/login");
		}
	}, [isPending, session, router]);

	if (isPending) {
		return (
			<div className="fixed inset-0 flex items-center justify-center">
				<Loading />
			</div>
		);
	}

	if (!session) return null;

	return <>{children}</>;
}
