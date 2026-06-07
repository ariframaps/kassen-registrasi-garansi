"use client";
// app/dashboard/upload/page.tsx
// Updated: multi-file queue, antrian per file, hash duplicate detection, fuzzy dealer match,
// direct customer flow, item_code unknown warning, backend integration

import { useState, useCallback, useRef } from "react";
import { uploadApi } from "@/lib/api/api-client";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import {
	Table,
	TableHead,
	TableHeader,
	TableBody,
	TableRow,
	TableCell,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import {
	Upload,
	FileSpreadsheet,
	CheckCircle,
	AlertTriangle,
	X,
	ChevronRight,
	Users,
	UserRound,
	AlertCircle,
	Hash,
	RefreshCcw,
} from "lucide-react";
import { normalizeSerialNumber } from "@/lib/utils";

// ── Types ──

interface PreviewRow {
	serialNumber: string;
	productType: string;
	productCategory: string;
	itemCodeOriginal?: string;
	status: "valid" | "duplicate" | "invalid" | "unknown_type";
	message?: string;
}

type DestType = "dealer" | "customer" | null;

interface QueueFile {
	id: string;
	file: File;
	hash: string;
	state:
		| "pending"
		| "duplicate_hash"
		| "processing"
		| "previewing"
		| "submitting"
		| "done"
		| "error";
	preview?: PreviewRow[];
	validCount: number;
	dupCount: number;
	unknownCount: number;
	destType: DestType;
	destLabel?: string;
	errorMessage?: string;
}

// ── Mock data ──

const MOCK_DEALERS = [
	{ id: "d1", name: "PT Maju Teknologi", score: 95 },
	{ id: "d2", name: "CV Berkah Elektronik", score: 60 },
	{ id: "d3", name: "Toko Abadi Jaya", score: 20 },
];

const MOCK_PREVIEW: PreviewRow[] = [
	{
		serialNumber: "SNNEW001XY",
		productType: "KDS 2215W",
		productCategory: "POS System",
		status: "valid",
	},
	{
		serialNumber: "SNNEW002AB",
		productType: "Queue Kiosk - Luna",
		productCategory: "POS System",
		status: "valid",
	},
	{
		serialNumber: "SNAC1234XY",
		productType: "KDS 2215W",
		productCategory: "POS System",
		status: "duplicate",
		message: "SN sudah ada di sistem",
	},
	{
		serialNumber: "SNNEW004CD",
		productType: "MC 40",
		productCategory: "Bill Counter",
		status: "valid",
	},
	{
		serialNumber: "SNNEW005EF",
		itemCodeOriginal: "POS-3453MFH",
		productType: "",
		productCategory: "",
		status: "unknown_type",
		message: "Item code 'POS-3453MFH' belum ada mapping",
	},
];

// Simulate SHA-256 hash (just a mock)
async function hashFile(file: File): Promise<string> {
	return `hash_${file.name}_${file.size}`;
}

// ── Fuzzy Dealer Match Modal ──
function FuzzyDealerModal({
	open,
	shipTo,
	onSelect,
	onCreateNew,
	onClose,
}: {
	open: boolean;
	shipTo: string;
	onSelect: (id: string, name: string) => void;
	onCreateNew: () => void;
	onClose: () => void;
}) {
	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Konfirmasi Dealer"
			description={`Ship To dari file: "${shipTo}"`}
			size="md">
			<div className="space-y-3">
				<p className="text-xs text-zinc-500 mb-3">
					Pilih dealer yang paling sesuai berdasarkan nama Ship To:
				</p>
				{MOCK_DEALERS.map((d) => (
					<button
						key={d.id}
						onClick={() => onSelect(d.id, d.name)}
						className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-zinc-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left">
						<div>
							<p className="text-sm font-medium text-zinc-800">{d.name}</p>
							<p className="text-xs text-zinc-400 mt-0.5">
								Kecocokan nama: {d.score}%
							</p>
						</div>
						{d.score >= 85 ? (
							<Badge variant="success">Sangat Cocok</Badge>
						) : d.score >= 50 ? (
							<Badge variant="warning">Mungkin Cocok</Badge>
						) : (
							<Badge variant="neutral">Kurang Cocok</Badge>
						)}
					</button>
				))}
				<button
					onClick={onCreateNew}
					className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-zinc-300 hover:border-blue-400 hover:bg-blue-50 transition-all text-left">
					<div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
						<span className="text-blue-600 text-xs font-bold">+</span>
					</div>
					<span className="text-sm text-zinc-600">Buat dealer baru</span>
				</button>
				<div className="flex justify-end pt-2">
					<Button variant="ghost" size="sm" onClick={onClose}>
						Batal
					</Button>
				</div>
			</div>
		</Modal>
	);
}

// ── New Dealer Form Modal ──
function NewDealerModal({
	open,
	onClose,
	onSave,
}: {
	open: boolean;
	onClose: () => void;
	onSave: (name: string, email: string) => void;
}) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	return (
		<Modal open={open} onClose={onClose} title="Tambah Dealer Baru" size="md">
			<div className="space-y-3">
				<Input
					label="Nama Dealer"
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
				/>
				<Input
					label="Email"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
				<Input
					label="Nomor Telepon"
					value={phone}
					onChange={(e) => setPhone(e.target.value)}
				/>
				<div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 border border-blue-100">
					Akun login dealer akan dibuat otomatis. Dealer akan mendapat email
					notifikasi cara login via OTP.
				</div>
				<div className="flex justify-end gap-2 pt-1">
					<Button variant="outline" size="sm" onClick={onClose}>
						Batal
					</Button>
					<Button
						size="sm"
						onClick={() => {
							if (name && email) {
								onSave(name, email);
							}
						}}>
						Simpan & Lanjut
					</Button>
				</div>
			</div>
		</Modal>
	);
}

// ── File Queue Item ──
function QueueItem({
	qf,
	index,
	total,
	isActive,
	onProcess,
	onSubmit,
	onSkip,
	onDestSelect,
	onFuzzyConfirm,
	onNewDealer,
}: {
	qf: QueueFile;
	index: number;
	total: number;
	isActive: boolean;
	onProcess: (id: string) => void;
	onSubmit: (id: string) => void;
	onSkip: (id: string) => void;
	onDestSelect: (id: string, type: DestType) => void;
	onFuzzyConfirm: (id: string, dealerId: string, dealerName: string) => void;
	onNewDealer: (id: string) => void;
}) {
	const isCurrent = isActive;
	const isDone = qf.state === "done";
	const isError = qf.state === "error";

	return (
		<div
			className={`border rounded-xl transition-all ${isCurrent ? "border-blue-300 shadow-sm" : isDone ? "border-emerald-200 bg-emerald-50/30" : "border-zinc-200 opacity-60"}`}>
			{/* Header */}
			<div className="flex items-center gap-3 px-4 py-3">
				<div
					className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isDone ? "bg-emerald-500 text-white" : isError ? "bg-red-500 text-white" : isCurrent ? "bg-blue-600 text-white" : "bg-zinc-200 text-zinc-500"}`}>
					{isDone ? "✓" : isError ? "!" : index + 1}
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-xs font-medium text-zinc-800 truncate">
						{qf.file.name}
					</p>
					<p className="text-[11px] text-zinc-400">
						{(qf.file.size / 1024).toFixed(0)} KB
					</p>
				</div>
				<div className="flex items-center gap-2">
					{isDone && <Badge variant="success">Selesai</Badge>}
					{isError && <Badge variant="danger">Error</Badge>}
					{qf.state === "duplicate_hash" && (
						<Badge variant="warning">File Duplikat</Badge>
					)}
					{qf.state === "submitting" && (
						<Badge variant="info">Menyimpan…</Badge>
					)}
				</div>
			</div>

			{/* Duplicate hash warning */}
			{qf.state === "duplicate_hash" && isCurrent && (
				<div className="mx-4 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
					<div className="flex gap-2 items-start mb-3">
						<Hash size={14} className="text-amber-500 shrink-0 mt-0.5" />
						<p className="text-xs text-amber-700">
							File ini sudah pernah diupload sebelumnya (hash SHA-256 cocok).
							Tetap lanjutkan?
						</p>
					</div>
					<div className="flex gap-2">
						<Button size="xs" variant="outline" onClick={() => onSkip(qf.id)}>
							Lewati File Ini
						</Button>
						<Button size="xs" onClick={() => onProcess(qf.id)}>
							Tetap Lanjutkan
						</Button>
					</div>
				</div>
			)}

			{/* Active: Preview */}
			{isCurrent && qf.state === "previewing" && qf.preview && (
				<div className="px-4 pb-4 space-y-3">
					{/* Summary badges */}
					<div className="flex gap-1.5 flex-wrap">
						<Badge variant="success">{qf.validCount} valid</Badge>
						{qf.dupCount > 0 && (
							<Badge variant="warning">{qf.dupCount} duplikat SN</Badge>
						)}
						{qf.unknownCount > 0 && (
							<Badge variant="warning">
								{qf.unknownCount} item code tidak dikenal
							</Badge>
						)}
					</div>

					{/* Unknown item code notice */}
					{qf.unknownCount > 0 && (
						<div className="flex gap-2 items-start p-3 bg-amber-50 border border-amber-100 rounded-xl">
							<AlertTriangle
								size={13}
								className="text-amber-500 shrink-0 mt-0.5"
							/>
							<div>
								<p className="text-xs font-medium text-amber-800">
									Ada item code yang belum dikenali
								</p>
								<p className="text-xs text-amber-700 mt-0.5">
									Anda bisa{" "}
									<a
										href="/dashboard/product-types"
										target="_blank"
										className="underline">
										tambahkan mapping
									</a>{" "}
									sekarang atau lewati item tersebut.
								</p>
							</div>
						</div>
					)}

					{/* Mini preview table */}
					<div className="border border-zinc-100 rounded-xl overflow-hidden">
						<table className="w-full text-xs">
							<thead className="bg-zinc-50 border-b border-zinc-100">
								<tr>
									<th className="px-3 py-2 text-left text-zinc-500 font-medium">
										Serial Number
									</th>
									<th className="px-3 py-2 text-left text-zinc-500 font-medium">
										Tipe Produk
									</th>
									<th className="px-3 py-2 text-left text-zinc-500 font-medium">
										Status
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-50">
								{qf.preview.map((r, i) => (
									<tr
										key={i}
										className={
											r.status === "duplicate"
												? "bg-amber-50/60"
												: r.status === "unknown_type"
													? "bg-yellow-50/60"
													: ""
										}>
										<td className="px-3 py-2">
											<span className="font-mono text-[11px] bg-zinc-100 px-1.5 py-0.5 rounded">
												{normalizeSerialNumber(r.serialNumber)}
											</span>
										</td>
										<td className="px-3 py-2 text-zinc-600">
											{r.productType || (
												<span className="text-amber-600 italic text-[11px]">
													{r.itemCodeOriginal} — belum dikenali
												</span>
											)}
										</td>
										<td className="px-3 py-2">
											<Badge
												variant={
													r.status === "valid"
														? "success"
														: r.status === "duplicate"
															? "warning"
															: "neutral"
												}
												dot>
												{r.status === "valid"
													? "Valid"
													: r.status === "duplicate"
														? "Duplikat"
														: "Tidak Dikenal"}
											</Badge>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{/* Destination */}
					{qf.validCount > 0 && (
						<div>
							<p className="text-xs font-medium text-zinc-700 mb-2">
								Tujuan produk ini:
							</p>
							<div className="grid grid-cols-2 gap-2">
								<button
									onClick={() => onDestSelect(qf.id, "dealer")}
									className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-left ${qf.destType === "dealer" ? "border-blue-400 bg-blue-50" : "border-zinc-200 hover:border-zinc-300"}`}>
									<Users
										size={14}
										className={
											qf.destType === "dealer"
												? "text-blue-600"
												: "text-zinc-400"
										}
									/>
									<div>
										<p
											className={`text-xs font-medium ${qf.destType === "dealer" ? "text-blue-700" : "text-zinc-700"}`}>
											Dealer
										</p>
										<p className="text-[11px] text-zinc-400">Stok dealer</p>
									</div>
								</button>
								<button
									onClick={() => onDestSelect(qf.id, "customer")}
									className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-left ${qf.destType === "customer" ? "border-blue-400 bg-blue-50" : "border-zinc-200 hover:border-zinc-300"}`}>
									<UserRound
										size={14}
										className={
											qf.destType === "customer"
												? "text-blue-600"
												: "text-zinc-400"
										}
									/>
									<div>
										<p
											className={`text-xs font-medium ${qf.destType === "customer" ? "text-blue-700" : "text-zinc-700"}`}>
											End Customer
										</p>
										<p className="text-[11px] text-zinc-400">
											Langsung terjual
										</p>
									</div>
								</button>
							</div>
						</div>
					)}

					{/* Dealer confirmed label */}
					{qf.destType === "dealer" && qf.destLabel && (
						<div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
							<CheckCircle size={13} />
							Dealer: <span className="font-medium">{qf.destLabel}</span>
						</div>
					)}

					{/* Submit button */}
					<div className="flex justify-between items-center pt-1">
						<Button
							variant="ghost"
							size="sm"
							icon={<X size={12} />}
							onClick={() => onSkip(qf.id)}>
							Lewati File Ini
						</Button>
						{qf.validCount > 0 && (
							<Button
								size="sm"
								onClick={() => onSubmit(qf.id)}
								disabled={
									!qf.destType || (qf.destType === "dealer" && !qf.destLabel)
								}
								icon={<ChevronRight size={13} />}
								iconPosition="right">
								Submit File Ini ({qf.validCount} produk)
							</Button>
						)}
					</div>
				</div>
			)}

			{/* Submitting */}
			{qf.state === "submitting" && (
				<div className="px-4 pb-4">
					<div className="flex items-center gap-2 text-xs text-zinc-500">
						<svg
							className="animate-spin w-3.5 h-3.5"
							fill="none"
							viewBox="0 0 24 24">
							<circle
								className="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="4"
							/>
							<path
								className="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
							/>
						</svg>
						Menyimpan data ke sistem…
					</div>
				</div>
			)}

			{/* Done summary */}
			{isDone && (
				<div className="px-4 pb-3 text-xs text-emerald-700 flex items-center gap-1.5">
					<CheckCircle size={12} />
					{qf.validCount} produk berhasil disimpan → {qf.destLabel ?? "sistem"}
				</div>
			)}

			{/* Error */}
			{isError && (
				<div className="px-4 pb-3 text-xs text-red-600 flex items-center gap-1.5">
					<AlertCircle size={12} />
					{qf.errorMessage ?? "Terjadi kesalahan saat menyimpan."}
				</div>
			)}
		</div>
	);
}

// ── Main Page ──

export default function UploadPage() {
	const [dragOver, setDragOver] = useState(false);
	const [queue, setQueue] = useState<QueueFile[]>([]);
	const [activeIdx, setActiveIdx] = useState(0);
	const [showFuzzy, setShowFuzzy] = useState(false);
	const [showNewDealer, setShowNewDealer] = useState(false);
	const [pendingFuzzyId, setPendingFuzzyId] = useState<string | null>(null);
	const [finished, setFinished] = useState(false);
	const { success, error: toastError } = useToast();

	const KNOWN_HASHES = ["hash_DO-already-uploaded.xlsx_12345"]; // mock

	const addFiles = useCallback(
		async (files: File[]) => {
			const valid = files.filter((f) => f.name.match(/\.(xlsx|xls)$/));
			if (valid.length !== files.length)
				toastError(
					"Ada file yang diabaikan",
					"Hanya .xlsx dan .xls yang diterima",
				);
			if (valid.length === 0) return;

			const newItems: QueueFile[] = await Promise.all(
				valid.map(async (f) => {
					const hash = await hashFile(f);
					const isDupHash = KNOWN_HASHES.includes(hash);
					return {
						id: `qf_${Date.now()}_${Math.random()}`,
						file: f,
						hash,
						state: isDupHash ? "duplicate_hash" : "pending",
						validCount: 0,
						dupCount: 0,
						unknownCount: 0,
						destType: null,
					};
				}),
			);

			setQueue((prev) => {
				const updated = [...prev, ...newItems];
				// If no active item was processing, start first pending
				return updated;
			});
			setFinished(false);
		},
		[toastError],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setDragOver(false);
			addFiles(Array.from(e.dataTransfer.files));
		},
		[addFiles],
	);

	const processFile = async (id: string) => {
		setQueue((prev) =>
			prev.map((q) => (q.id === id ? { ...q, state: "processing" } : q)),
		);
		await new Promise((r) => setTimeout(r, 800));
		setQueue((prev) =>
			prev.map((q) =>
				q.id === id
					? {
							...q,
							state: "previewing",
							preview: MOCK_PREVIEW,
							validCount: MOCK_PREVIEW.filter((r) => r.status === "valid")
								.length,
							dupCount: MOCK_PREVIEW.filter((r) => r.status === "duplicate")
								.length,
							unknownCount: MOCK_PREVIEW.filter(
								(r) => r.status === "unknown_type",
							).length,
						}
					: q,
			),
		);
	};

	const skipFile = (id: string) => {
		setQueue((prev) =>
			prev.map((q) =>
				q.id === id ? { ...q, state: "done", destLabel: "Dilewati" } : q,
			),
		);
		advanceQueue(id);
	};

	const setDestType = (id: string, type: DestType) => {
		setQueue((prev) =>
			prev.map((q) =>
				q.id === id ? { ...q, destType: type, destLabel: undefined } : q,
			),
		);
		if (type === "dealer") {
			setPendingFuzzyId(id);
			setShowFuzzy(true);
		}
	};

	const handleFuzzySelect = (dealerId: string, dealerName: string) => {
		if (pendingFuzzyId) {
			setQueue((prev) =>
				prev.map((q) =>
					q.id === pendingFuzzyId ? { ...q, destLabel: dealerName } : q,
				),
			);
		}
		setShowFuzzy(false);
		setPendingFuzzyId(null);
	};

	const handleFuzzyNewDealer = () => {
		setShowFuzzy(false);
		setShowNewDealer(true);
	};

	const handleNewDealerSave = (name: string, _email: string) => {
		if (pendingFuzzyId) {
			setQueue((prev) =>
				prev.map((q) =>
					q.id === pendingFuzzyId ? { ...q, destLabel: name } : q,
				),
			);
		}
		setShowNewDealer(false);
		setPendingFuzzyId(null);
	};

	const submitFile = async (id: string) => {
		const queueFile = queue.find((q) => q.id === id);
		if (!queueFile) return;

		setQueue((prev) =>
			prev.map((q) => (q.id === id ? { ...q, state: "submitting" } : q)),
		);

		try {
			await uploadApi.uploadAccurateFile(
				queueFile.file,
				queueFile.destType as "dealer" | "customer",
				queueFile.destLabel || "",
			);

			setQueue((prev) =>
				prev.map((q) => (q.id === id ? { ...q, state: "done" } : q)),
			);
			advanceQueue(id);
			success("File berhasil diupload", `${queueFile.validCount} produk ditambahkan`);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Gagal mengupload file";
			setQueue((prev) =>
				prev.map((q) =>
					q.id === id
						? { ...q, state: "error", errorMessage: message }
						: q,
				),
			);
			toastError("Upload gagal", message);
			advanceQueue(id);
		}
	};

	const advanceQueue = (doneId: string) => {
		setQueue((prev) => {
			const nextPending = prev.findIndex(
				(q) => q.state === "pending" && q.id !== doneId,
			);
			if (nextPending !== -1) {
				setActiveIdx(nextPending);
				// auto-process
				setTimeout(() => processFile(prev[nextPending].id), 300);
			} else {
				const allDone = prev.every(
					(q) =>
						q.state === "done" ||
						q.state === "error" ||
						(q.id === doneId ? true : false),
				);
				if (allDone) {
					setFinished(true);
					const total = prev.reduce(
						(s, q) => s + (q.state === "done" ? q.validCount : 0),
						0,
					);
					success(
						"Upload selesai",
						`${total} produk berhasil ditambahkan ke sistem`,
					);
				}
			}
			return prev;
		});
	};

	const startQueue = async () => {
		if (queue.length === 0) return;
		const firstPending = queue.findIndex((q) => q.state === "pending");
		if (firstPending !== -1) {
			setActiveIdx(firstPending);
			await processFile(queue[firstPending].id);
		}
	};

	const resetAll = () => {
		setQueue([]);
		setActiveIdx(0);
		setFinished(false);
	};

	const doneCount = queue.filter((q) => q.state === "done").length;
	const totalValid = queue.reduce((s, q) => s + q.validCount, 0);
	const hasUnstarted = queue.some((q) => q.state === "pending");
	const activeFile = queue[activeIdx];

	return (
		<div>
			<Topbar
				title="Upload dari Accurate"
				description="Import data produk dari ekspor file Accurate"
			/>
			<div className="mx-auto p-6 animate-fade-up space-y-5 max-w-3xl">
				{/* Guide steps */}
				<div className="grid grid-cols-3 gap-3">
					{[
						{
							n: "1",
							t: "Pilih File",
							d: "Drag & drop atau klik, bisa multi-file sekaligus",
						},
						{
							n: "2",
							t: "Review per File",
							d: "Preview, pilih tujuan, submit satu per satu",
						},
						{
							n: "3",
							t: "Selesai",
							d: "File berhasil disimpan, lanjut ke file berikutnya",
						},
					].map((s) => (
						<div
							key={s.n}
							className="bg-white border border-zinc-100 rounded-xl px-4 py-3.5 shadow-sm flex items-start gap-3">
							<div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
								<span className="text-white text-[10px] font-bold">{s.n}</span>
							</div>
							<div>
								<p className="text-xs font-semibold text-zinc-800">{s.t}</p>
								<p className="text-[11px] text-zinc-400 mt-0.5">{s.d}</p>
							</div>
						</div>
					))}
				</div>

				{/* Drop zone (only show if no queue or reset) */}
				{queue.length === 0 && (
					<Card>
						<CardHeader
							title="Pilih File Excel"
							description="Bisa pilih beberapa file sekaligus"
						/>
						<CardContent>
							<div
								onDragOver={(e) => {
									e.preventDefault();
									setDragOver(true);
								}}
								onDragLeave={() => setDragOver(false)}
								onDrop={handleDrop}
								className={`relative border-2 border-dashed rounded-xl transition-all duration-200 ${
									dragOver
										? "border-blue-400 bg-blue-50"
										: "border-zinc-200 hover:border-zinc-300 bg-zinc-50"
								}`}>
								<div className="py-12 text-center pointer-events-none">
									<Upload size={24} className="text-zinc-300 mx-auto mb-2" />
									<p className="text-sm text-zinc-500">
										Drag & drop atau klik untuk browse
									</p>
									<p className="text-xs text-zinc-400 mt-1">
										.xlsx atau .xls · bisa multi-file
									</p>
								</div>
								<input
									type="file"
									accept=".xlsx,.xls"
									multiple
									onChange={(e) => {
										if (e.target.files) addFiles(Array.from(e.target.files));
									}}
									className="absolute inset-0 opacity-0 cursor-pointer"
								/>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Queue */}
				{queue.length > 0 && (
					<Card>
						<CardHeader
							title={`Antrian Upload (${queue.length} file)`}
							description={`${doneCount} dari ${queue.length} file selesai`}
							action={
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										icon={<RefreshCcw size={12} />}
										onClick={resetAll}>
										Reset
									</Button>
									{hasUnstarted &&
										queue.every(
											(q) =>
												q.state === "pending" || q.state === "duplicate_hash",
										) && (
											<Button
												size="sm"
												icon={<Upload size={13} />}
												onClick={startQueue}>
												Mulai Proses
											</Button>
										)}
								</div>
							}
						/>
						<CardContent className="space-y-3">
							{/* Progress bar */}
							<div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
								<div
									className="h-full bg-blue-600 rounded-full transition-all duration-500"
									style={{
										width: `${queue.length ? (doneCount / queue.length) * 100 : 0}%`,
									}}
								/>
							</div>

							{/* File items */}
							<div className="space-y-2">
								{queue.map((qf, i) => (
									<QueueItem
										key={qf.id}
										qf={qf}
										index={i}
										total={queue.length}
										isActive={
											i === activeIdx &&
											qf.state !== "done" &&
											qf.state !== "error"
										}
										onProcess={processFile}
										onSubmit={submitFile}
										onSkip={skipFile}
										onDestSelect={setDestType}
										onFuzzyConfirm={handleFuzzySelect}
										onNewDealer={handleFuzzyNewDealer}
									/>
								))}
							</div>

							{/* Add more files button */}
							{!finished && (
								<div className="relative">
									<label className="flex items-center justify-center gap-2 w-full py-2 border border-dashed border-zinc-200 rounded-xl text-xs text-zinc-500 hover:border-blue-300 hover:text-blue-600 cursor-pointer transition-all">
										<Upload size={12} />
										Tambah File Lain
										<input
											type="file"
											accept=".xlsx,.xls"
											multiple
											onChange={(e) => {
												if (e.target.files)
													addFiles(Array.from(e.target.files));
											}}
											className="absolute inset-0 opacity-0 cursor-pointer"
										/>
									</label>
								</div>
							)}
						</CardContent>

						{/* Summary when all done */}
						{finished && (
							<div className="mx-5 mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
								<CheckCircle
									size={18}
									className="text-emerald-500 shrink-0 mt-0.5"
								/>
								<div className="flex-1">
									<p className="text-sm font-semibold text-emerald-800">
										Semua file selesai diproses!
									</p>
									<p className="text-xs text-emerald-700 mt-0.5">
										{totalValid} produk berhasil ditambahkan ·{" "}
										{
											queue.filter(
												(q) => q.state === "done" && q.destLabel === "Dilewati",
											).length
										}{" "}
										file dilewati
									</p>
								</div>
								<Button size="sm" variant="outline" onClick={resetAll}>
									Upload Lagi
								</Button>
							</div>
						)}
					</Card>
				)}
			</div>

			{/* Modals */}
			<FuzzyDealerModal
				open={showFuzzy}
				shipTo="PT Maju Teknologi Tbk"
				onSelect={handleFuzzySelect}
				onCreateNew={handleFuzzyNewDealer}
				onClose={() => {
					setShowFuzzy(false);
					setPendingFuzzyId(null);
				}}
			/>
			<NewDealerModal
				open={showNewDealer}
				onClose={() => setShowNewDealer(false)}
				onSave={handleNewDealerSave}
			/>
		</div>
	);
}
