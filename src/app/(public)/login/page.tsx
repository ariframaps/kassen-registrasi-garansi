"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { authApi } from "@/lib/api/api-client";
import { authClient } from "@/lib/auth-client";
import { getLoginRedirect } from "@/lib/get-login-redirect";
import { siteConfig } from "@/configs/site.config";
import Loading from "@/components/ui/loading";

export default function LoginPage() {
	const { data: session, isPending: isCheckingSession } =
		authClient.useSession();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const router = useRouter();

	const handleSignIn = async () => {
		setLoading(true);
		setError("");

		try {
			const data = await authApi.signIn({ email, password });
			if (data) {
				router.push(getLoginRedirect(data.user.role));
			}
		} catch (error) {
			if (error instanceof Error) setError(error.message);
			else setError("Terjadi kesalahan, silahkan coba lagi.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (session) {
			router.push(getLoginRedirect(session.user.role));
		}
	}, [session, router]);

	return (
		<div className="min-h-screen flex bg-zinc-50">
			{/* Left panel */}
			<div className="hidden lg:flex w-[400px] shrink-0 flex-col bg-zinc-900 relative overflow-hidden">
				<div
					className="absolute inset-0 opacity-[0.04]"
					style={{
						backgroundImage:
							"linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
						backgroundSize: "32px 32px",
					}}
				/>
				<div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600 opacity-20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
				<div className="relative p-8">
					<div className="flex items-center gap-2.5 mb-16">
						<div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
							<Shield size={15} className="text-white" />
						</div>
						<span className="text-white font-semibold text-sm">
							{siteConfig.SITE_NAME}
						</span>
					</div>
					<h2 className="text-2xl font-semibold text-white mb-2">
						Sistem Manajemen
						<br />
						Garansi Produk
					</h2>
					<p className="text-zinc-400 text-sm leading-relaxed">
						Platform registrasi garansi.
					</p>
				</div>
			</div>

			{/* Right: form */}

			<div className="flex-1 flex items-center justify-center p-8">
				<div className="w-full max-w-[380px]">
					<div className="flex items-center gap-2 mb-8 lg:hidden">
						<div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
							<Shield size={13} className="text-white" />
						</div>
						<span className="font-semibold text-zinc-900 text-sm">
							{siteConfig.SITE_NAME}
						</span>
					</div>

					{isCheckingSession ? (
						<Loading />
					) : (
						<div className="animate-fade-up">
							<h1 className="text-xl font-semibold text-zinc-900 mb-0.5">
								Masuk
							</h1>
							<p className="text-sm text-zinc-400 mb-7">
								Masuk menggunakan email dan password Anda
							</p>

							<div className="space-y-3">
								<div>
									<label className="block text-xs font-medium text-zinc-700 mb-1.5">
										Email
									</label>
									<input
										type="email"
										placeholder="email@kassengaransi.id"
										value={email}
										onChange={(e) => {
											setEmail(e.target.value);
											setError("");
										}}
										onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
										autoFocus
										className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all"
									/>
								</div>
								<div>
									<div className="flex items-center justify-between mb-1.5">
										<label className="block text-xs font-medium text-zinc-700">
											Password
										</label>
										<Link
											href="/forgot-password"
											className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
											Lupa password?
										</Link>
									</div>
									<input
										type="password"
										placeholder="••••••••"
										value={password}
										onChange={(e) => {
											setPassword(e.target.value);
											setError("");
										}}
										onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
										className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all"
									/>
								</div>
								{error && <p className="text-xs text-red-600 px-1">{error}</p>}
								<Button
									fullWidth
									size="lg"
									loading={loading}
									disabled={!email || !password}
									onClick={handleSignIn}>
									Masuk
								</Button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
