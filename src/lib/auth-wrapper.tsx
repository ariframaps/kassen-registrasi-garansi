// components/auth-guard.tsx
"use client";

import { authClient } from "@/lib/auth-client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Loading from "@/components/ui/loading";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const pathName = usePathname();

	const { data: session, isPending } = authClient.useSession();

	const isPublicPage = pathName === "/login" || pathName === "/check";

	useEffect(() => {
		// Tunggu sampai proses pembacaan session selesai
		if (isPending) return;

		// 1. Jika BELUM login dan mencoba akses halaman PRIVAT -> Redirect ke /login
		if (!session && !isPublicPage) {
			router.replace("/login");
		}

		// 2. Jika SUDAH login dan mencoba akses halaman PUBLIK (seperti /login) -> Redirect ke Dashboard/Home
		if (session && isPublicPage) {
			router.replace("/"); // Sesuaikan path ini jika halaman utama kamu bukan "/"
		}
	}, [isPending, session, isPublicPage, router]); // Cukup 4 elemen ini saja


	// Tampilkan loading spinner selama status session masih dicek
	if (isPending) {
		return (
			<div className="fixed inset-0 flex items-center justify-center">
				<Loading />
			</div>
		);
	}

	// Jika belum login dan di halaman publik, izinkan render
	if (!session && isPublicPage) {
		return <>{children}</>;
	}

	// Jika sudah login dan di halaman publik, tahan render (mencegah flash) saat router.replace bekerja
	if (session && isPublicPage) {
		return null;
	}

	// Jika belum login dan di halaman privat, tahan render saat router.replace bekerja
	if (!session && !isPublicPage) {
		return null;
	}

	return <>{children}</>;
}