"use client";
// app/dashboard/page.tsx — Admin: all activity. Sales: only waiting list requests.
import { Topbar } from "@/components/layout/topbar";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	mockDashboardStats,
	mockRecentActivity,
	mockSalesNotifications,
} from "@/mock/mock-data";
import { useAuth } from "@/lib/auth-context";
import {
	Package,
	Layers,
	Shield,
	ShieldOff,
	Clock,
	TrendingUp,
	Bell,
	Circle,
} from "lucide-react";

const activityIcon: Record<string, React.ReactNode> = {
	warranty_registered: <Shield size={13} className="text-emerald-500" />,
	product_uploaded: <Package size={13} className="text-blue-500" />,
	product_assigned: <Layers size={13} className="text-violet-500" />,
	waiting_list: <Clock size={13} className="text-amber-500" />,
	notification_sent: <TrendingUp size={13} className="text-cyan-500" />,
};

export default function DashboardPage() {
	const { user } = useAuth();
	const s = mockDashboardStats; // todo : fetch real stats from backend
	const isSales = user?.role === "sales";

	return (
		<div>
			<Topbar
				title="Dashboard"
				description={
					isSales
						? `Selamat datang, ${user?.name}`
						: "Ringkasan sistem registrasi garansi"
				}
			/>
			<div className="p-6 space-y-5">
				{/* Stats */}
				<div className="grid grid-cols-5 gap-4 animate-fade-up">
					<StatCard
						title="Total Produk"
						value={s.totalProducts}
						icon={<Package size={16} />}
						color="blue"
						subtitle="Semua produk terupload"
					/>
					<StatCard
						title="Assigned ke Dealer"
						value={s.totalAssigned}
						icon={<Layers size={16} />}
						color="violet"
						subtitle="Sudah diserahkan"
					/>
					<StatCard
						title="Garansi Aktif"
						value={s.totalWarrantyActive}
						icon={<Shield size={16} />}
						color="emerald"
						subtitle="Dalam masa garansi"
					/>
					<StatCard
						title="Garansi Berakhir"
						value={s.totalWarrantyExpired}
						icon={<ShieldOff size={16} />}
						color="red"
						subtitle="Perlu perhatian"
					/>
					<StatCard
						title="Waiting List"
						value={s.totalWaitingList}
						icon={<Clock size={16} />}
						color="amber"
						subtitle="Belum dinotifikasi"
					/>
				</div>

				{isSales ? (
					/* ── SALES: only waiting list notifications ── */
					<Card className="animate-fade-up delay-2">
						<CardHeader
							title="Notifikasi Request Produk"
							description="Request dari end user dan dealer yang perlu ditindaklanjuti"
							action={
								<Badge variant="warning">
									{mockSalesNotifications.filter((n) => !n.read).length} baru
								</Badge>
							}
						/>
						<CardContent className="p-0">
							<ul className="divide-y divide-zinc-50">
								{mockSalesNotifications.map((n, i) => (
									<li
										key={n.id}
										className={`flex items-start gap-3 px-5 py-3.5 hover:bg-zinc-50/50 transition-colors animate-fade-up delay-${Math.min(i + 1, 5)} ${!n.read ? "bg-amber-50/40" : ""}`}>
										<div
											className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${!n.read ? "bg-amber-100" : "bg-zinc-100"}`}>
											<Clock
												size={13}
												className={!n.read ? "text-amber-600" : "text-zinc-400"}
											/>
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<p
													className={`text-xs ${!n.read ? "text-zinc-900 font-medium" : "text-zinc-600"}`}>
													{n.description}
												</p>
												{!n.read && (
													<Circle
														size={6}
														className="text-amber-500 fill-amber-500 shrink-0"
													/>
												)}
											</div>
											<div className="flex items-center gap-2 mt-0.5">
												<span className="text-[11px] text-zinc-400">
													{n.email}
												</span>
												<span className="text-zinc-200">·</span>
												<span className="text-[11px] text-zinc-400">
													{n.time}
												</span>
											</div>
										</div>
									</li>
								))}
							</ul>
							<div className="px-5 py-3 border-t border-zinc-50">
								<a
									href="/dashboard/waiting-list"
									className="text-xs text-blue-600 hover:underline">
									Lihat semua di Waiting List →
								</a>
							</div>
						</CardContent>
					</Card>
				) : (
					/* ── ADMIN: full activity log ── */
					<Card className="animate-fade-up delay-2">
						<CardHeader
							title="Aktivitas Terbaru"
							description="Log semua aktivitas sistem dalam 7 hari terakhir"
						/>
						<CardContent className="p-0">
							<ul className="divide-y divide-zinc-50">
								{mockRecentActivity.map((a, i) => (
									<li
										key={a.id}
										className={`flex items-start gap-3 px-5 py-3.5 hover:bg-zinc-50/50 transition-colors animate-fade-up delay-${Math.min(i + 1, 5)}`}>
										<div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
											{activityIcon[a.type]}
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-xs text-zinc-800">{a.description}</p>
											<div className="flex items-center gap-2 mt-0.5">
												<span className="text-[11px] text-zinc-400">
													{a.user}
												</span>
												<span className="text-zinc-200">·</span>
												<span className="text-[11px] text-zinc-400">
													{a.time}
												</span>
											</div>
										</div>
									</li>
								))}
							</ul>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
