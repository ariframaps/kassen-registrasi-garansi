"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation"; // Tambahkan usePathname
import { useEffect } from "react";
import Loading from "@/components/ui/loading";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const pathname = usePathname(); // Ambil path halaman saat ini

	const { data: session, isPending } = authClient.useSession();

	// Tentukan halaman mana saja yang bebas diakses tanpa login
	const isPublicPage = pathname === "/login" || pathname === "/check";

	useEffect(() => {
		// Hanya redirect ke /login jika user tidak punya session DAN sedang tidak di halaman publik
		if (!isPending && !session && !isPublicPage) {
			router.replace("/login");
		}
	}, [isPending, session, router, isPublicPage]);

	// Jika sedang loading session, tampilkan loading screen
	if (isPending) {
		return (
			<div className="fixed inset-0 flex items-center justify-center">
				<Loading />
			</div>
		);
	}

	// Jika tidak ada session tapi dia membuka halaman login/register, izinkan masuk (jangan di-block)
	if (!session && isPublicPage) {
		return <>{children}</>;
	}

	// Jika tidak ada session dan bukan halaman publik (sudah ditangani oleh useEffect untuk redirect)
	if (!session) return null;

	return <>{children}</>;
}
