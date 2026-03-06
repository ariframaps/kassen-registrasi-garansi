"use client";
// app/login/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Zap, Shield, Package, Users } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [show, setShow] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const { login } = useAuth();
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			await login(email, password);
			router.push(
				email === "dealer@warranty.com" ? "/dealer/dashboard" : "/dashboard",
			);
		} catch {
			setError("Email atau password tidak valid");
		} finally {
			setLoading(false);
		}
	};

	const demos = [
		// { email: "admin@warranty.com",  label: "Superadmin", tag: "Full access" },
		{ email: "sales@warranty.com", label: "Sales", tag: "Upload & assign" },
		{
			email: "dealer@warranty.com",
			label: "Dealer",
			tag: "Registrasi garansi",
		},
	];

	return (
		<div className="min-h-screen flex bg-zinc-50">
			{/* Left */}
			<div className="hidden lg:flex w-[420px] shrink-0 flex-col bg-zinc-900 relative overflow-hidden">
				{/* subtle grid */}
				<div
					className="absolute inset-0 opacity-[0.04]"
					style={{
						backgroundImage:
							"linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
						backgroundSize: "32px 32px",
					}}
				/>
				{/* glow */}
				<div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600 opacity-20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

				<div className="relative p-8">
					<div className="flex items-center gap-2.5 mb-16">
						<div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
							<Zap size={15} className="text-white" />
						</div>
						<span className="text-white font-semibold text-sm">
							{SITE_NAME}
						</span>
					</div>
					<h2 className="text-2xl font-semibold text-white mb-2">
						Kassen - Sistem Manajemen
						<br />
						Garansi Produk
					</h2>
					{/* <p className="text-zinc-400 text-sm leading-relaxed">Platform terpadu untuk distribusi, aktivasi garansi, dan pelacakan status produk.</p> */}
				</div>

				<div className="relative mt-auto p-8 space-y-3">
					{[
						{
							icon: <Package size={14} />,
							t: "Manajemen Produk",
							d: "Upload & assign serial number ke dealer",
						},
						{
							icon: <Shield size={14} />,
							t: "Garansi Terstruktur",
							d: "Aktivasi garansi berbasis tanggal jual",
						},
						// { icon: <Users   size={14} />, t: "Multi-Role Access",  d: "Superadmin, Sales, Dealer" },
					].map((f, i) => (
						<div
							key={i}
							className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
							<div className="w-7 h-7 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 shrink-0">
								{f.icon}
							</div>
							<div>
								<p className="text-xs font-medium text-zinc-200">{f.t}</p>
								<p className="text-[11px] text-zinc-500">{f.d}</p>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Right */}
			<div className="flex-1 flex items-center justify-center p-8">
				<div className="w-full max-w-[360px] animate-fade-up">
					{/* mobile logo */}
					<div className="flex items-center gap-2 mb-8 lg:hidden">
						<div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
							<Zap size={13} className="text-white" />
						</div>
						<span className="font-semibold text-zinc-900 text-sm">
							{SITE_NAME}
						</span>
					</div>

					<h1 className="text-xl font-semibold text-zinc-900 mb-0.5">Masuk</h1>
					<p className="text-sm text-zinc-400 mb-7">
						Akses dashboard menggunakan email dan password Anda
					</p>

					<form onSubmit={handleSubmit} className="space-y-4">
						<Input
							label="Email"
							type="email"
							placeholder="email@contoh.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							autoComplete="email"
						/>
						<Input
							label="Password"
							type={show ? "text" : "password"}
							placeholder="••••••••"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							rightIcon={
								<button
									type="button"
									onClick={() => setShow(!show)}
									className="hover:text-zinc-600">
									{show ? <EyeOff size={14} /> : <Eye size={14} />}
								</button>
							}
						/>
						{error && (
							<div className="px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
								{error}
							</div>
						)}
						<Button
							type="submit"
							fullWidth
							size="lg"
							loading={loading}
							className="mt-1">
							Masuk ke Dashboard
						</Button>
					</form>

					{/* Demo */}
					<div className="mt-8">
						<p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider text-center mb-3">
							Demo — klik untuk isi otomatis
						</p>
						<div className="grid gap-2">
							{demos.map((d) => (
								<button
									key={d.email}
									type="button"
									onClick={() => {
										setEmail(d.email);
										setPassword("demo");
									}}
									className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-zinc-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 transition-all group">
									<div className="text-left">
										<p className="text-xs font-medium text-zinc-800 group-hover:text-blue-700">
											{d.label}
										</p>
										<p className="text-[11px] text-zinc-400">{d.tag}</p>
									</div>
									<span className="text-[10px] font-mono text-zinc-400 group-hover:text-blue-500 shrink-0">
										{d.email.split("@")[0]}
									</span>
								</button>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
