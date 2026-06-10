"use client";
import { useState, useMemo, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
// import { Pagination } from "@/components/ui/pagination";
// import { mockWaitingList, mockProducts } from "@/mock/mock-data";
import { formatDateShort } from "@/lib/utils";
import {
	Search,
	Bell,
	CheckCircle2,
	Clock,
	User,
	Building2,
	Mail,
	MessageSquare,
	AlertTriangle,
	Send,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import type { WaitingListEntry } from "@/types";
import { ProductSchema, WaitingListSchema } from "@/db/schema";
import { ProductWithNestedSchema } from "@/services/product.service";
import { productApi, waitingListApi } from "@/lib/api/api-client";

type NotifOption =
	| "check_sn" // end_user: "cek ulang SN, mungkin typo"
	| "warranty_detail" // end_user: "SN ditemukan, ini detail garansinya"
	| "dealer_ready"; // dealer: "SN sudah ditambahkan, silahkan daftarkan"

// ── Notification Modal ──
function NotifModal({
	entry,
	onClose,
}: {
	entry: WaitingListSchema;
	onClose: () => void;
}) {
	const [product, setProduct] = useState<ProductSchema>();
	const [wlPage, setWlPage] = useState(1);
	const [wlPageSize, setWlPageSize] = useState(20);
	const [selected, setSelected] = useState<NotifOption | null>(null);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const { success } = useToast();

	const isDealer = entry.requesterType === "dealer";
	const snExists = !!product;

	// Options depend on requestor type
	const options: {
		key: NotifOption;
		icon: React.ReactNode;
		title: string;
		desc: string;
		preview: string;
		disabled?: boolean;
	}[] = isDealer
		? [
				{
					key: "dealer_ready",
					icon: <CheckCircle2 size={16} className="text-emerald-500" />,
					title: "Produk siap didaftarkan",
					desc: "Beri tahu dealer bahwa produk sudah ditambahkan ke sistem",
					preview: `Kepada ${entry.requesterName},\n\nProduk dengan SN ${entry.serialNumberRequested} telah ditambahkan ke sistem KassenGaransi. Silahkan login ke dashboard dealer Anda dan daftarkan garansi produk tersebut segera.\n\nTerima kasih.`,
				},
			]
		: [
				{
					key: "check_sn",
					icon: <AlertTriangle size={16} className="text-amber-500" />,
					title: "Minta cek ulang serial number",
					desc: "SN tidak ditemukan di sistem — mungkin ada typo",
					preview: `Kepada ${entry.requesterName},\n\nTerima kasih telah menghubungi kami. Serial number yang Anda masukkan (${entry.serialNumberRequested}) tidak ditemukan dalam sistem kami.\n\nMohon periksa kembali serial number di produk Anda (biasanya tertera di stiker bagian bawah atau dalam kemasan). Jika Anda yakin SN sudah benar, hubungi dealer tempat Anda membeli produk.\n\nTerima kasih.`,
				},
				{
					key: "warranty_detail",
					icon: <CheckCircle2 size={16} className="text-emerald-500" />,
					title: "Kirim detail status garansi",
					desc: snExists
						? `SN ditemukan — garansi ${product?.status === "warranty_active" ? "aktif" : "sudah berakhir"}`
						: "SN tidak ditemukan di sistem",
					preview: snExists
						? `Kepada ${entry.requesterName},\n\nBerikut informasi garansi produk Anda:\n\n• Serial Number: ${entry.serialNumberRequested}\n• Status Garansi: ${product?.status === "warranty_active" ? "Aktif ✓" : "Berakhir ✗"}\n• Masa Garansi: ${product?.warrantyStartDate ?? "-"} s/d ${product?.warrantyEndDate ?? "-"}\n\nJika ada pertanyaan, silahkan hubungi kami.\n\nTerima kasih.`
						: "⚠ SN tidak ditemukan — gunakan opsi 'Cek ulang SN' sebagai gantinya.",
					disabled: !snExists,
				},
			];

	const selectedOption = options.find((o) => o.key === selected);

	const handleSend = async () => {
		setLoading(true);
		try {
			await waitingListApi.notify(entry.id, selected!);
			setLoading(false);
			setConfirmOpen(false);
			onClose();
			const optLabel = options.find((o) => o.key === selected)?.title;
			success("Notifikasi terkirim", `${entry.requesterName} — ${optLabel}`);
		} catch (error) {
			setLoading(false);
			console.error("Failed to send notification:", error);
		}
	};

	useEffect(() => {
		Promise.all([
			productApi.findOneBySN({ sn: entry.serialNumberRequested }),
		]).then(([p]) => {
			if (p.success) setProduct(p.data);
		});
	}, []);

	return (
		<>
			<Modal
				open
				onClose={onClose}
				title="Kirim Notifikasi"
				description={`ke ${entry.requesterName}`}
				size="lg">
				<div className="space-y-4">
					{/* Requestor info */}
					<div className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
						<div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
							{isDealer ? (
								<Building2 size={14} className="text-zinc-500" />
							) : (
								<User size={14} className="text-zinc-500" />
							)}
						</div>
						<div className="flex-1">
							<p className="text-xs font-semibold text-zinc-900">
								{entry.requesterName}
							</p>
							<p className="text-[11px] text-zinc-400">
								{entry.requesterEmail} · {entry.requesterPhone}
							</p>
						</div>
						<div className="flex flex-col items-end gap-1">
							<Badge variant={isDealer ? "blue" : "neutral"}>
								{isDealer ? "Dealer" : "End User"}
							</Badge>
							<span className="text-[11px] font-mono text-zinc-400">
								SN: {entry.serialNumberRequested}
							</span>
						</div>
					</div>

					{/* SN status */}
					{snExists ? (
						<div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
							<CheckCircle2 size={13} className="text-emerald-600" />
							<p className="text-xs text-emerald-700">
								SN ditemukan dalam sistem —{" "}
								{/* <span className="font-medium">{product?.productType}</span>, */}
								garansi{" "}
								<span className="font-medium">
									{product?.status === "warranty_active" ? "aktif" : "berakhir"}
								</span>
							</p>
						</div>
					) : (
						<div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
							<AlertTriangle size={13} className="text-amber-600" />
							<p className="text-xs text-amber-700">
								SN{" "}
								<span className="font-mono font-medium">
									{entry.serialNumberRequested}
								</span>{" "}
								tidak ditemukan dalam sistem
							</p>
						</div>
					)}

					{/* Choose notification type */}
					<div>
						<p className="text-xs font-semibold text-zinc-700 mb-2">
							Pilih jenis notifikasi
						</p>
						<div className="space-y-2">
							{options.map((opt) => (
								<button
									key={opt.key}
									disabled={opt.disabled}
									onClick={() => setSelected(opt.key)}
									className={`w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
										opt.disabled
											? "opacity-40 cursor-not-allowed border-zinc-100 bg-zinc-50"
											: selected === opt.key
												? "border-blue-400 bg-blue-50"
												: "border-zinc-200 hover:border-zinc-300 bg-white"
									}`}>
									<div className="mt-0.5 shrink-0">{opt.icon}</div>
									<div>
										<p
											className={`text-xs font-semibold ${selected === opt.key ? "text-blue-800" : "text-zinc-800"}`}>
											{opt.title}
										</p>
										<p className="text-[11px] text-zinc-400 mt-0.5">
											{opt.desc}
										</p>
									</div>
									{selected === opt.key && (
										<CheckCircle2
											size={14}
											className="text-blue-500 ml-auto shrink-0 mt-0.5"
										/>
									)}
								</button>
							))}
						</div>
					</div>

					{/* Preview */}
					{selectedOption && (
						<div>
							<p className="text-xs font-semibold text-zinc-700 mb-2 flex items-center gap-1.5">
								<Mail size={12} />
								Preview Email + Notifikasi Dashboard
							</p>
							<pre className="text-[11px] text-zinc-600 bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 whitespace-pre-wrap font-sans leading-relaxed max-h-44 overflow-y-auto">
								{selectedOption.preview}
							</pre>
							<p className="text-[11px] text-zinc-400 mt-1.5 flex items-center gap-1">
								<Send size={10} />
								Akan dikirim ke{" "}
								<span className="font-medium">{entry.requesterEmail}</span>{" "}
								&amp; notifikasi dashboard
								{isDealer && (
									<span className="text-blue-600 ml-1">(dealer)</span>
								)}
							</p>
						</div>
					)}

					<div className="flex gap-2 pt-1">
						<Button variant="outline" fullWidth onClick={onClose}>
							Batal
						</Button>
						<Button
							fullWidth
							disabled={!selected}
							icon={<Send size={13} />}
							onClick={() => setConfirmOpen(true)}>
							Kirim Notifikasi
						</Button>
					</div>
				</div>
			</Modal>

			<ConfirmModal
				open={confirmOpen}
				onClose={() => setConfirmOpen(false)}
				onConfirm={handleSend}
				title="Kirim Notifikasi?"
				description={`Notifikasi "${selectedOption?.title}" akan dikirim ke email ${entry.requesterEmail}${isDealer ? " dan dashboard dealer mereka" : ""}.`}
				confirmLabel="Kirim Sekarang"
				loading={loading}
			/>
		</>
	);
}

// ── Main Page ──
export default function WaitingListPage() {
	const [waitingLists, setWaitingLists] = useState<WaitingListSchema[]>([]);
	const [search, setSearch] = useState("");
	const [notifTarget, setNotif] = useState<WaitingListSchema | null>(null);

	const filtered = useMemo(() => {
		const q = search.toLowerCase();
		return waitingLists.filter(
			(e) =>
				e.requesterName?.toLowerCase().includes(q) ||
				e.serialNumberRequested.toLowerCase().includes(q) ||
				e.requesterEmail?.toLowerCase().includes(q),
		);
	}, [waitingLists, search, waitingLists]);

	const unnotified = waitingLists.filter((e) => e.status === "pending").length;

	useEffect(() => {
		Promise.all([waitingListApi.getAll()]).then(([w]) => {
			if (w.success) setWaitingLists(w.data);
		});
	}, []);

	return (
		<div>
			<Topbar
				title="Waiting List"
				description="Request produk dari end user dan dealer"
			/>
			<div className="p-6 animate-fade-up space-y-4">
				<div className="grid grid-cols-3 gap-4">
					{[
						{ l: "Total Request", v: waitingLists.length, c: "text-zinc-900" },
						{ l: "Belum Dinotifikasi", v: unnotified, c: "text-amber-600" },
						{
							l: "Sudah Dinotifikasi",
							v: waitingLists.length - unnotified,
							c: "text-emerald-600",
						},
					].map((s) => (
						<div
							key={s.l}
							className="bg-white border border-zinc-200 rounded-xl px-4 py-3.5 shadow-sm">
							<p className="text-xs text-zinc-400 mb-1">{s.l}</p>
							<p className={`text-2xl font-semibold font-mono ${s.c}`}>{s.v}</p>
						</div>
					))}
				</div>

				<Card>
					<div className="px-5 py-3.5 border-b border-zinc-100 flex items-center gap-3">
						<div className="flex-1 max-w-64">
							<Input
								placeholder="Cari nama, SN, atau email…"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								leftIcon={<Search size={13} />}
							/>
						</div>
						<p className="text-xs text-zinc-400 ml-auto">
							{filtered.length} request
						</p>
					</div>
					<CardContent className="p-0">
						<Table>
							<TableHead>
								<TableHeader>Pemohon</TableHeader>
								<TableHeader>Tipe</TableHeader>
								<TableHeader>Serial Number</TableHeader>
								{/* <TableHeader>Produk di Sistem</TableHeader> */}
								<TableHeader>Tgl Request</TableHeader>
								<TableHeader>Status</TableHeader>
								<TableHeader className="text-right pr-5">Aksi</TableHeader>
							</TableHead>
							<TableBody>
								{filtered.length === 0 ? (
									<tr>
										<td colSpan={7}>
											<EmptyState
												icon={<Clock size={18} />}
												title="Tidak ada request"
											/>
										</td>
									</tr>
								) : (
									filtered.map((e) => {
										// const product = getProductBySN(e.serialNumberRequested);
										return (
											<TableRow key={e.id}>
												<TableCell>
													<p className="text-xs font-medium text-zinc-900">
														{e.requesterName}
													</p>
													<p className="text-[11px] text-zinc-400">
														{e.requesterEmail}
													</p>
												</TableCell>
												<TableCell>
													<Badge
														variant={
															e.requesterType === "dealer" ? "blue" : "neutral"
														}>
														{e.requesterType === "dealer"
															? "Dealer"
															: "End User"}
													</Badge>
												</TableCell>
												<TableCell>
													<span className="font-mono text-xs bg-zinc-100 text-zinc-700 px-2 py-1 rounded-md">
														{e.serialNumberRequested}
													</span>
												</TableCell>
												{/* <TableCell>
													{product ? (
														<div>
															<p className="text-xs text-zinc-700">
																{product.productType}
															</p>
															<Badge
																variant={
																	product.warrantyStatus === "active"
																		? "success"
																		: product.warrantyStatus === "expired"
																			? "danger"
																			: "neutral"
																}
																dot
																className="mt-0.5 text-[10px]">
																{product.warrantyStatus === "active"
																	? "Garansi Aktif"
																	: product.warrantyStatus === "expired"
																		? "Berakhir"
																		: "Belum Terdaftar"}
															</Badge>
														</div>
													) : (
														<span className="text-xs text-zinc-300">
															Tidak ditemukan
														</span>
													)}
												</TableCell> */}
												<TableCell>
													<span className="text-xs text-zinc-400">
														{formatDateShort(e.createdAt)}
													</span>
												</TableCell>
												<TableCell>
													<Badge
														variant={e.notifiedAt ? "success" : "warning"}
														dot>
														{e.notifiedAt ? "Sudah Dinotifikasi" : "Belum"}
													</Badge>
												</TableCell>
												<TableCell>
													<div className="flex justify-end">
														<Button
															size="xs"
															variant={e.notifiedAt ? "outline" : "primary"}
															icon={<Bell size={11} />}
															onClick={() => setNotif(e)}>
															{e.notifiedAt ? "Kirim Lagi" : "Notifikasi"}
														</Button>
													</div>
												</TableCell>
											</TableRow>
										);
									})
								)}
							</TableBody>
						</Table>
						{/* <Pagination
							page={wlPage}
							pageSize={wlPageSize}
							total={filtered.length}
							onPageChange={setWlPage}
							onPageSizeChange={(s) => { setWlPageSize(s); setWlPage(1); }}
						/> */}
					</CardContent>
				</Card>
			</div>

			{notifTarget && (
				<NotifModal entry={notifTarget} onClose={() => setNotif(null)} />
			)}
		</div>
	);
}
