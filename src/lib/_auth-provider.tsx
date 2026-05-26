"use client";

import { createContext, useContext } from "react";

import { authClient } from "@/lib/auth-client";
import Loading from "@/components/ui/loading";

type AuthContextType = {
	session: ReturnType<typeof authClient.useSession>["data"];
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return (
			<div className="fixed inset-0 flex items-center justify-center">
				<Loading />
			</div>
		);
	}

	return (
		<AuthContext.Provider value={{ session }}>{children}</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);

	if (!ctx) {
		throw new Error("useAuth must be used within AuthProvider");
	}

	return ctx;
}
