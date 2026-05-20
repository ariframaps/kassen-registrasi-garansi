"use client";
// app/support/products/page.tsx — Technical Support: all registered products default valid, can change condition
import { useState, useMemo } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import {
	Table,
	TableHead,
	TableHeader,
	TableBody,
	TableRow,
	TableCell,
	EmptyState,
} from "@/components/ui/table";
import { mockProducts, PRODUCT_CATEGORIES } from "@/mock/mock-data";
import { conditionsStore, setCondition } from "@/lib/warranty-conditions.store";
import type { ConditionEntry } from "@/lib/warranty-conditions.store";
import { formatDateShort, getDaysRemaining } from "@/lib/utils";
import {
	Search,
	CheckCircle2,
	XCircle,
	Wrench,
	Package,
	AlertTriangle,
	ShieldCheck,
	RotateCcw,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import type { Product } from "@/types";

// Only products with active warranty are shown here
const eligibleProducts = mockProducts.filter(
	(p) => p.warrantyStatus === "active",
);

function ConditionBadge({ cond }: { cond: ConditionEntry | null }) {
	if (!cond || cond.warrantyCondition === "valid")
		return (
			<Badge variant="success" dot>
				Valid
			</Badge>
		);
	return (
		<Badge variant="danger" dot>
			Rejected
		</Badge>
	);
}

// ── Condition Update Modal ──
function ConditionModal({
	product,
	current,
	onClose,
	onSave,
}: {
	product: Product;
	current: ConditionEntry | null;
	onClose: () => void;
	onSave: (data: ConditionEntry) => void;
}) {
	const currentStatus = current?.warrantyCondition ?? "valid";
	const [status, setStatus] = useState<"valid" | "rejected">(
		currentStatus === "rejected" ? "rejected" : "valid",
	);
	const [note, setNote] = useState(current?.warrantyConditionNote ?? "");
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const { success } = useToast();

	const isDowngrading = currentStatus === "valid" && status === "rejected";
	const isUpgrading = currentStatus === "rejected" && status === "valid";
	const unchanged = currentStatus === status;

	const handleConfirm = async () => {
		setLoading(true);
		await new Promise((r) => setTimeout(r, 700));
		setLoading(false);
		const data: ConditionEntry = {
			warrantyCondition: status,
			warrantyConditionNote: note.trim(),
			warrantyConditionUpdatedAt: new Date().toISOString().slice(0, 10),
			warrantyConditionUpdatedBy: "Technical Support",
		};
		onSave(data);
		setConfirmOpen(false);
		onClose();
		success(
			status === "valid"
				? "Kondisi diubah ke Valid"
				: "Kondisi diubah ke Rejected",
			`SN ${product.serialNumber}`,
		);
	};

	const days = product.warrantyEndDate
		? getDaysRemaining(product.warrantyEndDate)
		: 0;

	return (
		<>
			<Modal open onClose={onClose} title="Update Kondisi Garansi" size="md">
				<div className="space-y-4">
					{/* Product info */}
					<div className="flex items-start gap-3 p-3.5 bg-zinc-50 rounded-xl border border-zinc-100">
						<div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
							<Package size={16} className="text-zinc-400" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="font-mono text-sm font-semibold text-zinc-900">
								{product.serialNumber}
							</p>
							<p className="text-xs text-zinc-500">
								{product.productType} · {product.productCategory}
							</p>
							<div className="flex items-center gap-3 mt-1">
								<span className="text-[11px] text-zinc-400">
									Customer:{" "}
									<span className="font-medium text-zinc-700">
										{product.customerName}
									</span>
								</span>
								{days > 0 && (
									<span className="text-[11px] text-emerald-600 font-medium">
										{days} hari tersisa
									</span>
								)}
							</div>
						</div>
						<div className="shrink-0">
							<ConditionBadge cond={current} />
						</div>
					</div>

					{/* Status selector */}
					<div>
						<p className="text-xs font-semibold text-zinc-700 mb-2">
							Ubah Kondisi Garansi
						</p>
						<div className="grid grid-cols-2 gap-3">
							{(["valid", "rejected"] as const).map((s) => (
								<button
									key={s}
									onClick={() => setStatus(s)}
									className={`flex items-center gap-2.5 p-3.5 rounded-xl border-2 transition-all text-left ${
										status === s
											? s === "valid"
												? "border-emerald-400 bg-emerald-50"
												: "border-red-400 bg-red-50"
											: "border-zinc-200 hover:border-zinc-300"
									}`}>
									{s === "valid" ? (
										<CheckCircle2
											size={18}
											className={
												status === "valid"
													? "text-emerald-500"
													: "text-zinc-300"
											}
										/>
									) : (
										<XCircle
											size={18}
											className={
												status === "rejected" ? "text-red-500" : "text-zinc-300"
											}
										/>
									)}
									<div>
										<p
											className={`text-xs font-semibold ${
												status === s
													? s === "valid"
														? "text-emerald-700"
														: "text-red-700"
													: "text-zinc-600"
											}`}>
											{s === "valid" ? "Valid" : "Rejected"}
										</p>
										<p className="text-[11px] text-zinc-400">
											{s === "valid"
												? "Garansi berlaku normal"
												: "Tidak memenuhi syarat"}
										</p>
									</div>
								</button>
							))}
						</div>
					</div>

					{/* Note field */}
					<div>
						<label className="block text-xs font-medium text-zinc-700 mb-1.5">
							{status === "rejected" ? (
								<>
									Alasan Rejection <span className="text-red-500">*</span>
								</>
							) : (
								"Catatan (opsional)"
							)}
						</label>
						<textarea
							value={note}
							onChange={(e) => setNote(e.target.value)}
							placeholder={
								status === "rejected"
									? "Contoh: Kerusakan akibat kelalaian pengguna, bukan cacat produksi…"
									: "Catatan hasil pengecekan kondisi…"
							}
							rows={3}
							className={`w-full px-3 py-2 text-sm bg-white border rounded-lg outline-none transition-all resize-none leading-relaxed
                ${
									status === "rejected" && !note.trim()
										? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-400/15"
										: "border-zinc-200 hover:border-zinc-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
								}`}
						/>
						{status === "rejected" && !note.trim() && (
							<p className="text-xs text-red-600 mt-1">
								Alasan wajib diisi untuk status Rejected
							</p>
						)}
					</div>

					{/* Warning if downgrading */}
					{isDowngrading && (
						<div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
							<AlertTriangle
								size={13}
								className="text-amber-600 shrink-0 mt-0.5"
							/>
							<p className="text-[11px] text-amber-700">
								Mengubah ke <strong>Rejected</strong> berarti garansi produk ini
								tidak bisa diklaim meskipun masih dalam periode aktif.
							</p>
						</div>
					)}
					{isUpgrading && (
						<div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
							<RotateCcw
								size={13}
								className="text-emerald-600 shrink-0 mt-0.5"
							/>
							<p className="text-[11px] text-emerald-700">
								Kondisi akan dikembalikan ke <strong>Valid</strong> — garansi
								berlaku normal kembali.
							</p>
						</div>
					)}

					<div className="flex gap-2 pt-1">
						<Button variant="outline" fullWidth onClick={onClose}>
							Batal
						</Button>
						<Button
							fullWidth
							disabled={status === "rejected" && !note.trim()}
							variant={status === "rejected" ? "danger" : "primary"}
							icon={
								status === "valid" ? (
									<CheckCircle2 size={13} />
								) : (
									<XCircle size={13} />
								)
							}
							onClick={() => setConfirmOpen(true)}>
							{unchanged
								? "Simpan Catatan"
								: `Ubah ke ${status === "valid" ? "Valid" : "Rejected"}`}
						</Button>
					</div>
				</div>
			</Modal>

			<ConfirmModal
				open={confirmOpen}
				onClose={() => setConfirmOpen(false)}
				onConfirm={handleConfirm}
				title={`Konfirmasi ubah kondisi ke ${status === "valid" ? "Valid" : "Rejected"}?`}
				description={
					status === "rejected"
						? `Garansi SN ${product.serialNumber} akan ditandai Rejected. Customer tidak bisa klaim garansi ini. Alasan: "${note}"`
						: `Garansi SN ${product.serialNumber} akan dikembalikan ke Valid dan bisa diklaim kembali.`
				}
				confirmLabel={
					status === "rejected"
						? "Ya, Reject Garansi"
						: "Ya, Kembalikan ke Valid"
				}
				variant={status === "rejected" ? "danger" : "primary"}
				loading={loading}
			/>
		</>
	);
}

// ── Main Page ──
export default function SupportProductsPage() {
	const [search, setSearch] = useState("");
	const [categoryFilter, setCategory] = useState("all");
	const [conditionFilter, setCondition] = useState("all");
	const [selectedProduct, setSelected] = useState<Product | null>(null);
	// local mirror of store for re-render
	const [, forceUpdate] = useState(0);

	const getC = (sn: string) => conditionsStore[sn] ?? null;

	const filtered = useMemo(() => {
		const q = search.toLowerCase();
		return eligibleProducts.filter((p) => {
			const matchSearch =
				p.serialNumber.toLowerCase().includes(q) ||
				p.productType.toLowerCase().includes(q) ||
				(p.customerName ?? "").toLowerCase().includes(q) ||
				(p.assignedDealerName ?? "").toLowerCase().includes(q);
			const matchCategory =
				categoryFilter === "all" || p.productCategory === categoryFilter;
			const cond = getC(p.serialNumber)?.warrantyCondition ?? "valid";
			const matchCondition =
				conditionFilter === "all"
					? true
					: conditionFilter === "valid"
						? cond === "valid"
						: conditionFilter === "rejected"
							? cond === "rejected"
							: true;
			return matchSearch && matchCategory && matchCondition;
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search, categoryFilter, conditionFilter]);

	const stats = {
		total: eligibleProducts.length,
		valid: eligibleProducts.filter(
			(p) => (getC(p.serialNumber)?.warrantyCondition ?? "valid") === "valid",
		).length,
		rejected: eligibleProducts.filter(
			(p) => getC(p.serialNumber)?.warrantyCondition === "rejected",
		).length,
	};

	return (
		<div>
			<Topbar
				title="Kondisi Garansi"
				description="Semua produk terdaftar garansinya valid secara default"
			/>
			<div className="p-6 animate-fade-up space-y-5">
				<div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3.5 flex items-start gap-3">
					<Wrench size={15} className="text-blue-600 shrink-0 mt-0.5" />
					<div>
						<p className="text-xs font-semibold text-blue-800">
							Default: semua produk terdaftar = Valid
						</p>
						<p className="text-xs text-blue-700 mt-0.5">
							Setiap produk yang sudah diregistrasikan garansinya otomatis
							berstatus <strong>Valid</strong>. Ubah ke{" "}
							<strong>Rejected</strong> jika tidak memenuhi syarat kondisi
							warranty (misalnya kerusakan akibat kelalaian pengguna).
						</p>
					</div>
				</div>

				{/* Stats */}
				<div className="grid grid-cols-3 gap-4">
					{[
						{
							l: "Total Produk Aktif",
							v: stats.total,
							c: "text-zinc-900",
							icon: <ShieldCheck size={15} className="text-blue-400" />,
						},
						{
							l: "Kondisi Valid",
							v: stats.valid,
							c: "text-emerald-600",
							icon: <CheckCircle2 size={15} className="text-emerald-500" />,
						},
						{
							l: "Rejected",
							v: stats.rejected,
							c: "text-red-600",
							icon: <XCircle size={15} className="text-red-500" />,
						},
					].map((s) => (
						<div
							key={s.l}
							className="bg-white border border-zinc-200 rounded-xl px-4 py-3.5 shadow-sm flex items-center gap-3">
							<div className="w-9 h-9 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
								{s.icon}
							</div>
							<div>
								<p className="text-xs text-zinc-400">{s.l}</p>
								<p className={`text-xl font-semibold font-mono ${s.c}`}>
									{s.v}
								</p>
							</div>
						</div>
					))}
				</div>

				<Card>
					<div className="px-5 py-3.5 border-b border-zinc-100 flex flex-wrap gap-2.5 items-center">
						<div className="flex-1 min-w-48 max-w-64">
							<Input
								placeholder="Cari SN, tipe, customer, dealer…"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								leftIcon={<Search size={13} />}
							/>
						</div>
						<Select
							options={[
								{ value: "all", label: "Semua Kategori" },
								...PRODUCT_CATEGORIES.map((c) => ({ value: c, label: c })),
							]}
							value={categoryFilter}
							onChange={(e) => setCategory(e.target.value)}
							className="w-44"
						/>
						<Select
							options={[
								{ value: "all", label: "Semua Kondisi" },
								{ value: "valid", label: "Valid" },
								{ value: "rejected", label: "Rejected" },
							]}
							value={conditionFilter}
							onChange={(e) => setCondition(e.target.value)}
							className="w-36"
						/>
						<p className="text-xs text-zinc-400 ml-auto">
							{filtered.length} produk
						</p>
					</div>

					<CardContent className="p-0">
						<Table>
							<TableHead>
								<TableHeader>Serial Number</TableHeader>
								<TableHeader>Produk</TableHeader>
								<TableHeader>Customer</TableHeader>
								<TableHeader>Dealer</TableHeader>
								<TableHeader>Berakhir</TableHeader>
								<TableHeader>Kondisi</TableHeader>
								<TableHeader>Catatan</TableHeader>
								<TableHeader className="text-right pr-5">Aksi</TableHeader>
							</TableHead>
							<TableBody>
								{filtered.length === 0 ? (
									<tr>
										<td colSpan={8}>
											<EmptyState
												icon={<Wrench size={18} />}
												title="Tidak ada produk"
											/>
										</td>
									</tr>
								) : (
									filtered.map((p) => {
										const cond = getC(p.serialNumber);
										const days = p.warrantyEndDate
											? getDaysRemaining(p.warrantyEndDate)
											: 0;
										return (
											<TableRow key={p.id}>
												<TableCell>
													<span className="font-mono text-xs bg-zinc-100 text-zinc-700 px-2 py-1 rounded-md">
														{p.serialNumber}
													</span>
												</TableCell>
												<TableCell>
													<p className="text-xs font-medium text-zinc-900">
														{p.productType}
													</p>
													<p className="text-[11px] text-zinc-400">
														{p.productCategory}
													</p>
												</TableCell>
												<TableCell>
													<p className="text-xs text-zinc-800">
														{p.customerName ?? "—"}
													</p>
													<p className="text-[11px] text-zinc-400 font-mono">
														{p.customerPhone ?? ""}
													</p>
												</TableCell>
												<TableCell>
													<span className="text-xs text-zinc-500">
														{p.assignedDealerName ?? "—"}
													</span>
												</TableCell>
												<TableCell>
													<p className="text-xs text-zinc-500">
														{p.warrantyEndDate
															? formatDateShort(p.warrantyEndDate)
															: "—"}
													</p>
													{days > 0 && days < 180 && (
														<p className="text-[11px] text-amber-600">
															{days}h lagi
														</p>
													)}
												</TableCell>
												<TableCell>
													<ConditionBadge cond={cond} />
												</TableCell>
												<TableCell>
													{cond?.warrantyConditionNote ? (
														<p className="text-[11px] text-zinc-500 max-w-[150px] truncate">
															{cond.warrantyConditionNote}
														</p>
													) : (
														<span className="text-zinc-300 text-xs">—</span>
													)}
												</TableCell>
												<TableCell>
													<div className="flex justify-end">
														<button
															onClick={() => setSelected(p)}
															className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
																(cond?.warrantyCondition ?? "valid") ===
																"rejected"
																	? "bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
																	: "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border-zinc-200"
															}`}>
															<Wrench size={11} />
															Update
														</button>
													</div>
												</TableCell>
											</TableRow>
										);
									})
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>

			{selectedProduct && (
				<ConditionModal
					product={selectedProduct}
					current={getC(selectedProduct.serialNumber)}
					onClose={() => setSelected(null)}
					onSave={(data) => {
						setCondition(selectedProduct.serialNumber);
						forceUpdate((n) => n + 1);
						setSelected(null);
					}}
				/>
			)}
		</div>
	);
}
