"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api/api-client";
import { siteConfig } from "@/configs/site.config";

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [sent, setSent] = useState(false);

	const handleSubmit = async () => {
		setLoading(true);
		setError("");

		try {
			await authApi.requestPasswordReset({ email });
			setSent(true);
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

				<Link
					href="/login"
					className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 mb-6 transition-colors">
					<ArrowLeft size={13} /> Kembali ke halaman masuk
				</Link>

				{sent ? (
					<div className="animate-fade-up">
						<h1 className="text-xl font-semibold text-zinc-900 mb-0.5">
							Cek Email Anda
						</h1>
						<p className="text-sm text-zinc-400">
							Jika email <span className="font-semibold text-zinc-700">{email}</span> terdaftar,
							kami telah mengirimkan tautan untuk mengatur ulang password Anda.
						</p>
					</div>
				) : (
					<div className="animate-fade-up">
						<h1 className="text-xl font-semibold text-zinc-900 mb-0.5">
							Lupa Password
						</h1>
						<p className="text-sm text-zinc-400 mb-7">
							Masukkan email Anda untuk menerima tautan reset password
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
									onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
									autoFocus
									className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all"
								/>
							</div>
							{error && <p className="text-xs text-red-600 px-1">{error}</p>}
							<Button
								fullWidth
								size="lg"
								loading={loading}
								disabled={!email}
								onClick={handleSubmit}>
								Kirim Tautan Reset
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
