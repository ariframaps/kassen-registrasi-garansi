"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api/api-client";
import { siteConfig } from "@/configs/site.config";

function ResetPasswordForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async () => {
		setError("");

		if (!token) {
			setError("Tautan reset password tidak valid atau sudah kedaluwarsa.");
			return;
		}
		if (newPassword.length < 8) {
			setError("Password minimal 8 karakter.");
			return;
		}
		if (newPassword !== confirmPassword) {
			setError("Konfirmasi password tidak cocok.");
			return;
		}

		setLoading(true);
		try {
			await authApi.resetPassword({ newPassword, token });
			router.push("/login");
		} catch (error) {
			if (error instanceof Error) setError(error.message);
			else setError("Terjadi kesalahan, silahkan coba lagi.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-zinc-50 p-8">
			<div className="w-full max-w-[380px]">
				<div className="flex items-center gap-2 mb-8">
					<div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
						<Shield size={13} className="text-white" />
					</div>
					<span className="font-semibold text-zinc-900 text-sm">
						{siteConfig.SITE_NAME}
					</span>
				</div>

				<div className="animate-fade-up">
					<h1 className="text-xl font-semibold text-zinc-900 mb-0.5">
						Atur Password Baru
					</h1>
					<p className="text-sm text-zinc-400 mb-7">
						Masukkan password baru untuk akun Anda
					</p>

					{!token ? (
						<div className="space-y-3">
							<p className="text-xs text-red-600 px-1">
								Tautan reset password tidak valid atau sudah kedaluwarsa.
							</p>
							<Link
								href="/forgot-password"
								className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
								Minta tautan baru
							</Link>
						</div>
					) : (
						<div className="space-y-3">
							<div>
								<label className="block text-xs font-medium text-zinc-700 mb-1.5">
									Password Baru
								</label>
								<input
									type="password"
									placeholder="••••••••"
									value={newPassword}
									onChange={(e) => {
										setNewPassword(e.target.value);
										setError("");
									}}
									autoFocus
									className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all"
								/>
							</div>
							<div>
								<label className="block text-xs font-medium text-zinc-700 mb-1.5">
									Konfirmasi Password
								</label>
								<input
									type="password"
									placeholder="••••••••"
									value={confirmPassword}
									onChange={(e) => {
										setConfirmPassword(e.target.value);
										setError("");
									}}
									onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
									className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all"
								/>
							</div>
							{error && <p className="text-xs text-red-600 px-1">{error}</p>}
							<Button
								fullWidth
								size="lg"
								loading={loading}
								disabled={!newPassword || !confirmPassword}
								onClick={handleSubmit}>
								Simpan Password
							</Button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default function ResetPasswordPage() {
	return (
		<Suspense>
			<ResetPasswordForm />
		</Suspense>
	);
}
