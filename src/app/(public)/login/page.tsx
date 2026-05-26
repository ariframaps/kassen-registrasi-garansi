"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
// import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, RefreshCw } from "lucide-react";
import { checkSession, resendOtp, signIn, verifyOtp } from "./_actions";
import { formattTimeToMnS } from "@/lib/utils";
import { isEmail } from "validator";
import { UserRole } from "@/types";
import { authConfig } from "@/configs/auth.config";
import { authApi } from "@/lib/api/api-client";
import { authClient } from "@/lib/auth-client";
import { siteConfig } from "@/configs/site.config";
import Loading from "@/components/ui/loading";

// TODO: logging login for users

const getLoginRedirect = (role: UserRole): string => {
	switch (role) {
		case "admin":
		case "sales":
			return "/dashboard";
		case "dealer":
			return "/dealer/dashboard";
		case "technical_support":
			return "/support/products";
		default:
			throw new Error("Invalid user role : ", role); // todo: handle the default value error state
	}
};

export default function LoginPage() {
	const {
		data: session,
		isPending: isCheckingSession, //loading state
		error: sessionError, //error object
		refetch, //refetch the session
	} = authClient.useSession();
	const [step, setStep] = useState<"email" | "otp">("email");
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [resendCd, setResendCd] = useState(0);

	// const { login } = useAuth();
	const router = useRouter();

	const startResendCountdown = () => {
		setResendCd(Number(authConfig.RATE_LIMIT_TIME_WINDOW));

		const timer = setInterval(() => {
			setResendCd((prev) => {
				if (prev <= 1) {
					clearInterval(timer);
					return 0;
				}

				return prev - 1;
			});
		}, 1000);
	};

	const handleSendOtp = async () => {
		if (resendCd > 0)
			throw new Error("Please wait before requesting another OTP.");

		setLoading(true);
		setError("");

		try {
			if (!isEmail(email)) throw new Error("Format email tidak valid!");
			await authApi.sendOtp({ email });
			startResendCountdown();
			setStep("otp");
		} catch (error) {
			if (error instanceof Error) setError(error.message);
			else setError("Terrjadi kesalahan, silahkan coba lagi.");
		} finally {
			setLoading(false);
		}
	};

	const handleVerifyOtp = async () => {
		setLoading(true);
		setError("");

		try {
			if (otp.length !== 6) throw new Error("Masukkan 6 digit kode OTP");
			await authApi.verifyOtp({ email, otp });
			refetch();
		} catch (error) {
			if (error instanceof Error) setError(error.message);
			else setError("Terrjadi kesalahan, silahkan coba lagi.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (session) {
			try {
				const redirectUrl = getLoginRedirect(session.user.role);
				router.push(redirectUrl);
			} catch (error) {
				if (error instanceof Error) setError(error.message);
			}
		}
	}, [session]);

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
					) : step === "email" ? (
						<div className="animate-fade-up">
							<h1 className="text-xl font-semibold text-zinc-900 mb-0.5">
								Masuk
							</h1>
							<p className="text-sm text-zinc-400 mb-7">
								Kode OTP akan dikirim ke email Anda
							</p>

							<div className="space-y-3">
								<div>
									<label className="block text-xs font-medium text-zinc-700 mb-1.5">
										Alamat Email
									</label>
									<input
										type="email"
										placeholder="email@kassengaransi.id"
										value={email}
										onChange={(e) => {
											setEmail(e.target.value);
											setError("");
										}}
										onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
										autoFocus
										className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all"
									/>
								</div>
								{error && <p className="text-xs text-red-600 px-1">{error}</p>}
								<Button
									fullWidth
									size="lg"
									// disabled={resendCd > 0}
									loading={loading}
									onClick={handleSendOtp}>
									Kirim Kode OTP
								</Button>
								{resendCd > 0 ? (
									<p className="text-xs text-zinc-400 text-center">
										Kirim ulang dalam{" "}
										<span className="font-mono font-semibold text-zinc-600">
											{formattTimeToMnS(resendCd)}
										</span>
									</p>
								) : null}
							</div>
						</div>
					) : (
						<div className="animate-fade-up">
							<button
								onClick={() => {
									setStep("email");
									setOtp("");
									setError("");
									// setMockOtp("");
								}}
								className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 mb-6 transition-colors">
								<ArrowLeft size={13} /> Ganti email
							</button>

							<h1 className="text-xl font-semibold text-zinc-900 mb-0.5">
								Cek Email Anda
							</h1>
							<p className="text-sm text-zinc-400 mb-1">Kode OTP dikirim ke</p>
							<p className="text-sm font-semibold text-zinc-800 mb-7">
								{email}
							</p>

							{/* OTP input: 6 boxes */}
							<div className="mb-4">
								<label className="block text-xs font-medium text-zinc-700 mb-2">
									Masukkan 6 digit kode
								</label>
								<div className="flex gap-2">
									{Array.from({ length: 6 }).map((_, i) => (
										<input
											key={i}
											id={`otp-${i}`}
											type="text"
											inputMode="numeric"
											maxLength={1}
											value={otp[i] ?? ""}
											onChange={(e) => {
												const val = e.target.value.replace(/\D/g, "").slice(-1);
												const newOtp = otp.split("");
												newOtp[i] = val;
												const filled = newOtp.join("").slice(0, 6);
												setOtp(filled);
												setError("");
												if (val && i < 5)
													document.getElementById(`otp-${i + 1}`)?.focus();
											}}
											onKeyDown={(e) => {
												if (e.key === "Backspace" && !otp[i] && i > 0) {
													document.getElementById(`otp-${i - 1}`)?.focus();
													setOtp((p) => p.slice(0, i - 1));
												}
											}}
											className={`w-full aspect-square text-center text-lg font-semibold border rounded-xl outline-none transition-all ${
												otp[i]
													? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/15"
													: "border-zinc-200 hover:border-zinc-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
											}`}
										/>
									))}
								</div>
							</div>

							{error && (
								<p className="text-xs text-red-600 mb-3 px-1">{error}</p>
							)}

							<Button
								fullWidth
								size="lg"
								loading={loading}
								disabled={otp.length < 6}
								onClick={handleVerifyOtp}>
								Verifikasi & Masuk
							</Button>

							<div className="mt-4 text-center">
								{resendCd > 0 ? (
									<p className="text-xs text-zinc-400">
										Kirim ulang dalam{" "}
										<span className="font-mono font-semibold text-zinc-600">
											{formattTimeToMnS(resendCd)}
										</span>
									</p>
								) : (
									<button
										onClick={handleSendOtp}
										className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 mx-auto transition-colors">
										<RefreshCw size={12} /> Kirim ulang kode
									</button>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
