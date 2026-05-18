"use client";
// lib/auth-context.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, UserRole } from "@/types";
import { mockUsers, loginMap } from "../mock/mock-users";
import { usePathname, useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";

interface AuthContextType {
	user: User | null;
	login: (email: string, password: string) => Promise<void>;
	logout: () => void;
	switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const pathName = usePathname();
	const [user, setUser] = useState<User | null>(null);

	const login = async (email: string) => {
		await new Promise((r) => setTimeout(r, 700));
		const uid = loginMap[email];
		const found = uid ? mockUsers.find((u) => u.id === uid) : undefined;
		if (!found || found.status === "inactive")
			throw new Error("Invalid credentials");
		setUser(found);
	};

	const logout = () => setUser(null);

	const switchRole = (role: UserRole) => {
		const found = mockUsers.find(
			(u) => u.role === role && u.status === "active",
		);
		if (found) setUser(found);
	};

	useEffect(() => {
		if (!user && pathName !== "/login" && pathName !== "/check") {
			router.push("/login");
		}
	}, [user, pathName, router]);

	return (
		<AuthContext.Provider value={{ user, login, logout, switchRole }}>
			{children}
			{!user && pathName !== "/login" && pathName !== "/check" && (
				<div className="fixed inset-0 z-50 bg-black/25 flex items-center justify-center">
					<div className="p-2 bg-white text-black">
						<Loader2Icon className="animate-spin" />
					</div>
				</div>
			)}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}
