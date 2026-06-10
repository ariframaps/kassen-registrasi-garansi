"use client";
// app/dashboard/upload/page.tsx
// Updated: multi-file queue, antrian per file, hash duplicate detection, fuzzy dealer match,
// direct customer flow, item_code unknown warning, backend integration

import React, { useState, useCallback, useRef } from "react";
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
	Plus,
	Loader2,
} from "lucide-react";
import { normalizeSerialNumber } from "@/lib/utils";
import { productCateogoryApi, productTypeApi, dealerApi, customerApi } from "@/lib/api/api-client";
import { CategorySchema, DealerSchema, CustomerSchema } from "@/db/schema";

// Simple fuzzy matching function
function fuzzyMatch(searchText: string, targetText: string): number {
	const search = searchText.toLowerCase();
	const target = targetText.toLowerCase();

	if (target.includes(search)) return 100;

	let score = 0;
	let searchIdx = 0;
	for (let i = 0; i < target.length && searchIdx < search.length; i++) {
		if (target[i] === search[searchIdx]) {
			score += 10;
			searchIdx++;
		}
	}
	return (searchIdx === search.length) ? score : 0;
}

// ── Types ──

interface PreviewRow {
	serialNumber: string;
	productType: string;
	productCategory: string;
	itemCodeOriginal?: string;
	itemDescription?: string;
	status: "valid" | "duplicate" | "invalid" | "unknown_type";
	message?: string;
}

type DestType = "dealer" | "customer" | null;

interface ParsedItem {
	itemCode: string;
	itemDescription: string;
	qty: number;
	unit: string;
	serialNumbers: string[];
}

interface PendingDealerCreation {
	name: string;
	email: string;
	phone?: string;
}

interface PendingCustomerCreation {
	name: string;
	email?: string;
	phone?: string;
}

interface PendingItemCode {
	code: string;
	productTypeName: string;
	categoryId: string;
	warrantyDurationMonths: number;
}

interface PurchaseData {
	purchaseDate: string;
	notes?: string;
	invoiceFile?: File;
	dealerId?: string; // optional - who is the dealer for this purchase
}

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
	parsedItems?: ParsedItem[];
	validCount: number;
	dupCount: number;
	unknownCount: number;
	destType: DestType;
	destLabel?: string;
	errorMessage?: string;
	shipTo?: string;
	doNumber?: string;
	// Pending creations (validated but not yet created)
	pendingDealerCreation?: PendingDealerCreation;
	pendingCustomerCreation?: PendingCustomerCreation;
	pendingItemCodes?: PendingItemCode[];
	// Purchase data for end customer
	purchaseData?: PurchaseData;
	// Track if item codes have been handled
	itemCodesHandled?: boolean;
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

// Generate SHA-256 hash of file
async function hashFile(file: File): Promise<string> {
	const buffer = await file.arrayBuffer();
	const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
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
	const [allDealers, setAllDealers] = React.useState<DealerSchema[]>([]);
	const [displayedDealers, setDisplayedDealers] = React.useState<
		(DealerSchema & { score: number })[]
	>([]);
	const [search, setSearch] = React.useState("");
	const [loading, setLoading] = React.useState(true);

	React.useEffect(() => {
		if (open) {
			loadDealers();
		}
	}, [open]);

	React.useEffect(() => {
		filterDealers(search);
	}, [search, allDealers]);

	const loadDealers = async () => {
		try {
			setLoading(true);
			const result = await dealerApi.getAll();
			if (result.success && result.data) {
				setAllDealers(result.data);
				// Initial: show fuzzy matched results
				const scoredDealers = result.data
					.map((d) => ({
						...d,
						score: fuzzyMatch(shipTo, d.name),
					}))
					.filter((d) => d.score > 0)
					.sort((a, b) => b.score - a.score);
				setDisplayedDealers(scoredDealers);
			}
		} catch (err) {
			console.error("Gagal load dealers:", err);
		} finally {
			setLoading(false);
		}
	};

	const filterDealers = (query: string) => {
		if (!query.trim()) {
			// Show fuzzy matched results
			const scoredDealers = allDealers
				.map((d) => ({
					...d,
					score: fuzzyMatch(shipTo, d.name),
				}))
				.filter((d) => d.score > 0)
				.sort((a, b) => b.score - a.score);
			setDisplayedDealers(scoredDealers);
		} else {
			// Search by name, email, or phone
			const queryLower = query.toLowerCase();
			const scoredDealers = allDealers
				.map((d) => {
					const nameMatch = fuzzyMatch(query, d.name);
					const emailMatch = d.email ? fuzzyMatch(query, d.email) : 0;
					const phoneMatch = d.phone ? fuzzyMatch(query, d.phone) : 0;
					const score = Math.max(nameMatch, emailMatch, phoneMatch);
					return { ...d, score };
				})
				.filter((d) => d.score > 0)
				.sort((a, b) => b.score - a.score);
			setDisplayedDealers(scoredDealers);
		}
	};

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Pilih atau Cari Dealer"
			description={`Ship To dari file: "${shipTo}"`}
			size="md">
			<div className="space-y-3">
				<Input
					label="Cari Dealer (nama, email, atau nomor telepon)"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Ketik nama, email, atau nomor telepon..."
				/>

				{loading ? (
					<div className="text-center py-4 text-xs text-zinc-500">
						Memuat dealers...
					</div>
				) : displayedDealers.length === 0 ? (
					<div className="text-center py-4 text-xs text-zinc-500">
						{search
							? `Tidak ada dealer yang cocok dengan "${search}"`
							: `Tidak ada dealer yang cocok dengan "${shipTo}"`}
					</div>
				) : (
					<div className="max-h-64 overflow-y-auto space-y-2">
						{displayedDealers.map((d) => (
							<button
								key={d.id}
								onClick={() => onSelect(d.id, d.name)}
								className="w-full flex items-start justify-between px-4 py-3 rounded-xl border border-zinc-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left">
								<div className="flex-1">
									<p className="text-sm font-medium text-zinc-800">{d.name}</p>
									{d.email && (
										<p className="text-xs text-zinc-400 mt-0.5">{d.email}</p>
									)}
									{d.phone && (
										<p className="text-xs text-zinc-400">{d.phone}</p>
									)}
								</div>
								{!search && (
									<Badge variant={d.score >= 50 ? "success" : "warning"}>
										{Math.round((d.score / 10) * 10)}%
									</Badge>
								)}
							</button>
						))}
					</div>
				)}

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
	suggestedName,
}: {
	open: boolean;
	onClose: () => void;
	onSave: (data: PendingDealerCreation) => void;
	suggestedName?: string;
}) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [loading, setLoading] = useState(false);
	const { error: toastError } = useToast();

	React.useEffect(() => {
		if (open && suggestedName) {
			setName(suggestedName);
		}
	}, [open, suggestedName]);

	const handleValidateAndSave = async () => {
		if (!name || !email) {
			toastError("Validasi", "Nama dan email wajib diisi");
			return;
		}

		setLoading(true);
		try {
			// Validate dealer creation
			const result = await dealerApi.validate({
				name: name.trim(),
				email: email.trim(),
				phone: phone?.trim(),
			});

			if (result.success) {
				// Only store pending data, don't create yet
				onSave({
					name: name.trim(),
					email: email.trim(),
					phone: phone?.trim(),
				});
				setName("");
				setEmail("");
				setPhone("");
			} else {
				throw new Error(result.message || "Validasi gagal");
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Validasi dealer gagal";
			toastError("Validasi Gagal", msg);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal open={open} onClose={onClose} title="Tambah Dealer Baru" size="md">
			<div className="space-y-3">
				<Input
					label="Nama Dealer"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Contoh: PT Maju Jaya, CV Elektronik"
					required
					disabled={loading}
				/>
				<Input
					label="Email"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					disabled={loading}
				/>
				<Input
					label="Nomor Telepon"
					type="tel"
					pattern="[0-9+\-\s]*"
					value={phone}
					onChange={(e) => {
						const value = e.target.value;
						// Only allow digits and common phone number characters
						if (/^[0-9+\-\s]*$/.test(value)) {
							setPhone(value);
						}
					}}
					disabled={loading}
				/>
				<div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 border border-blue-100">
					Akun login dealer akan dibuat otomatis saat upload selesai. Dealer akan mendapat email notifikasi.
				</div>
				<div className="flex justify-end gap-2 pt-1">
					<Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
						Batal
					</Button>
					<Button
						size="sm"
						onClick={handleValidateAndSave}
						disabled={loading || !name || !email}
						icon={loading ? <Loader2 size={13} className="animate-spin" /> : undefined}
						iconPosition="left">
						{loading ? "Validasi..." : "Simpan & Lanjut"}
					</Button>
				</div>
			</div>
		</Modal>
	);
}

// ── New Customer Form Modal ──
function NewCustomerModal({
	open,
	onClose,
	onSave,
	suggestedName,
}: {
	open: boolean;
	onClose: () => void;
	onSave: (data: PendingCustomerCreation) => void;
	suggestedName?: string;
}) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [loading, setLoading] = useState(false);
	const { error: toastError } = useToast();

	React.useEffect(() => {
		if (open && suggestedName) {
			setName(suggestedName);
		}
	}, [open, suggestedName]);

	const handleValidateAndSave = async () => {
		if (!name.trim()) {
			toastError("Validasi", "Nama customer wajib diisi");
			return;
		}

		setLoading(true);
		try {
			// Validate customer creation
			const result = await customerApi.validate({
				name: name.trim(),
				email: email?.trim(),
				phone: phone?.trim(),
			});

			if (result.success) {
				// Only store pending data, don't create yet
				onSave({
					name: name.trim(),
					email: email?.trim(),
					phone: phone?.trim(),
				});
				setName("");
				setEmail("");
				setPhone("");
			} else {
				throw new Error(result.message || "Validasi gagal");
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Validasi customer gagal";
			toastError("Validasi Gagal", msg);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal open={open} onClose={onClose} title="Tambah Customer Baru" size="md">
			<div className="space-y-3">
				<Input
					label="Nama Customer/Toko"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Contoh: Toko ABC, PT Maju Jaya"
					required
					disabled={loading}
				/>
				<Input
					label="Email (Optional)"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					disabled={loading}
				/>
				<Input
					label="Nomor Telepon (Optional)"
					type="tel"
					pattern="[0-9+\-\s]*"
					value={phone}
					onChange={(e) => {
						const value = e.target.value;
						// Only allow digits and common phone number characters
						if (/^[0-9+\-\s]*$/.test(value)) {
							setPhone(value);
						}
					}}
					disabled={loading}
				/>
				<div className="flex justify-end gap-2 pt-1">
					<Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
						Batal
					</Button>
					<Button
						size="sm"
						onClick={handleValidateAndSave}
						disabled={loading || !name.trim()}
						icon={loading ? <Loader2 size={13} className="animate-spin" /> : undefined}
						iconPosition="left">
						{loading ? "Validasi..." : "Simpan & Lanjut"}
					</Button>
				</div>
			</div>
		</Modal>
	);
}

// ── Fuzzy Customer Modal ──
function FuzzyCustomerModal({
	open,
	shipTo,
	onSelect,
	onCreateNew,
	onClose,
}: {
	open: boolean;
	shipTo: string;
	onSelect: (name: string) => void;
	onCreateNew: () => void;
	onClose: () => void;
}) {
	const [allCustomers, setAllCustomers] = React.useState<CustomerSchema[]>([]);
	const [displayedCustomers, setDisplayedCustomers] = React.useState<
		(CustomerSchema & { score: number })[]
	>([]);
	const [search, setSearch] = React.useState("");
	const [loading, setLoading] = React.useState(true);

	React.useEffect(() => {
		if (open) {
			loadCustomers();
		}
	}, [open]);

	React.useEffect(() => {
		filterCustomers(search);
	}, [search, allCustomers]);

	const loadCustomers = async () => {
		try {
			setLoading(true);
			const result = await customerApi.getAll();
			if (result.success && result.data) {
				setAllCustomers(result.data);
				const scoredCustomers = result.data
					.map((c) => ({
						...c,
						score: fuzzyMatch(shipTo, c.name),
					}))
					.filter((c) => c.score > 0)
					.sort((a, b) => b.score - a.score);
				setDisplayedCustomers(scoredCustomers);
			}
		} catch (err) {
			console.error("Gagal load customers:", err);
		} finally {
			setLoading(false);
		}
	};

	const filterCustomers = (query: string) => {
		if (!query.trim()) {
			const scoredCustomers = allCustomers
				.map((c) => ({
					...c,
					score: fuzzyMatch(shipTo, c.name),
				}))
				.filter((c) => c.score > 0)
				.sort((a, b) => b.score - a.score);
			setDisplayedCustomers(scoredCustomers);
		} else {
			const scoredCustomers = allCustomers
				.map((c) => {
					const nameMatch = fuzzyMatch(query, c.name);
					const emailMatch = c.email ? fuzzyMatch(query, c.email) : 0;
					const phoneMatch = c.phone ? fuzzyMatch(query, c.phone) : 0;
					const score = Math.max(nameMatch, emailMatch, phoneMatch);
					return { ...c, score };
				})
				.filter((c) => c.score > 0)
				.sort((a, b) => b.score - a.score);
			setDisplayedCustomers(scoredCustomers);
		}
	};

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Pilih atau Cari Customer"
			description={`Ship To dari file: "${shipTo}"`}
			size="md">
			<div className="space-y-3">
				<Input
					label="Cari Customer (nama, email, atau nomor telepon)"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Ketik nama, email, atau nomor telepon..."
				/>

				{loading ? (
					<div className="text-center py-4 text-xs text-zinc-500">
						Memuat customers...
					</div>
				) : displayedCustomers.length === 0 ? (
					<div className="text-center py-4 text-xs text-zinc-500">
						{search
							? `Tidak ada customer yang cocok dengan "${search}"`
							: `Tidak ada customer yang cocok dengan "${shipTo}"`}
					</div>
				) : (
					<div className="max-h-64 overflow-y-auto space-y-2">
						{displayedCustomers.map((c) => (
							<button
								key={c.id}
								onClick={() => onSelect(c.name)}
								className="w-full flex items-start justify-between px-4 py-3 rounded-xl border border-zinc-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left">
								<div className="flex-1">
									<p className="text-sm font-medium text-zinc-800">{c.name}</p>
									{c.email && (
										<p className="text-xs text-zinc-400 mt-0.5">{c.email}</p>
									)}
									{c.phone && (
										<p className="text-xs text-zinc-400">{c.phone}</p>
									)}
								</div>
								{!search && (
									<Badge variant={c.score >= 50 ? "success" : "warning"}>
										{Math.round((c.score / 10) * 10)}%
									</Badge>
								)}
							</button>
						))}
					</div>
				)}

				<button
					onClick={onCreateNew}
					className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-zinc-300 hover:border-blue-400 hover:bg-blue-50 transition-all text-left">
					<div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
						<span className="text-blue-600 text-xs font-bold">+</span>
					</div>
					<span className="text-sm text-zinc-600">Buat customer baru</span>
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

// ── End Customer Input Modal ──
function EndCustomerModal({
	open,
	onClose,
	onSave,
	onCreateNew,
}: {
	open: boolean;
	onClose: () => void;
	onSave: (name: string) => void;
	onCreateNew: () => void;
}) {
	const [name, setName] = useState("");

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="End Customer"
			size="sm"
		>
			<div className="space-y-3">
				<p className="text-xs text-zinc-500">
					Pilih customer yang ada atau buat baru:
				</p>

				<Input
					label="Nama Customer/Toko"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Contoh: Toko ABC, PT Maju Jaya"
					required
					autoFocus
				/>

				<div className="bg-amber-50 rounded-lg p-2 text-xs text-amber-700 border border-amber-200">
					💡 Jika customer tidak ada, klik "Buat Customer Baru" untuk menambahkan.
				</div>

				<div className="flex flex-col gap-2 pt-2">
					<Button
						size="sm"
						onClick={() => {
							if (name.trim()) {
								onSave(name.trim());
							}
						}}
						disabled={!name.trim()}>
						Simpan Customer
					</Button>
					<Button
						size="sm"
						variant="outline"
						onClick={onCreateNew}>
						Buat Customer Baru
					</Button>
				</div>

				<div className="flex justify-end pt-2 border-t border-zinc-200">
					<Button variant="ghost" size="sm" onClick={onClose}>
						Batal
					</Button>
				</div>
			</div>
		</Modal>
	);
}

// ── Purchase Form Modal ──
function PurchaseFormModal({
	open,
	onClose,
	onSave,
}: {
	open: boolean;
	onClose: () => void;
	onSave: (data: PurchaseData) => void;
}) {
	const [purchaseDate, setPurchaseDate] = useState<string>(
		new Date().toISOString().split("T")[0]
	);
	const [notes, setNotes] = useState("");
	const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
	const [loading, setLoading] = useState(false);
	const { error: toastError } = useToast();

	const handleSave = async () => {
		if (!purchaseDate) {
			toastError("Validasi", "Tanggal pembelian wajib diisi");
			return;
		}

		setLoading(true);
		try {
			onSave({
				purchaseDate,
				notes: notes?.trim() || undefined,
				invoiceFile: invoiceFile || undefined,
			});
			// Reset form
			setPurchaseDate(new Date().toISOString().split("T")[0]);
			setNotes("");
			setInvoiceFile(null);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Gagal menyimpan data pembelian";
			toastError("Error", msg);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Detail Pembelian (End Customer)"
			size="md">
			<div className="space-y-3">
				<div>
					<label className="text-xs font-medium text-zinc-700 mb-1.5 block">
						Tanggal Pembelian*
					</label>
					<input
						type="date"
						value={purchaseDate}
						onChange={(e) => setPurchaseDate(e.target.value)}
						disabled={loading}
						className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						required
					/>
				</div>

				<Input
					label="Catatan (Optional)"
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					placeholder="Contoh: Pembelian offline, custom order, dll"
					disabled={loading}
				/>

				<div>
					<label className="text-xs font-medium text-zinc-700 mb-1.5 block">
						Invoice/Receipt (Optional)
					</label>
					<div className="border-2 border-dashed border-zinc-200 rounded-lg p-3 text-center hover:border-blue-300 cursor-pointer transition-colors">
						<input
							type="file"
							accept=".pdf,.jpg,.jpeg,.png"
							onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
							disabled={loading}
							className="sr-only"
							id="invoice-upload"
						/>
						<label htmlFor="invoice-upload" className="cursor-pointer block">
							{invoiceFile ? (
								<div className="text-xs">
									<p className="font-medium text-emerald-600">✓ File dipilih</p>
									<p className="text-zinc-500 mt-1">{invoiceFile.name}</p>
									<p
										className="text-blue-600 underline mt-2"
										onClick={() => setInvoiceFile(null)}>
										Ganti file
									</p>
								</div>
							) : (
								<div className="text-xs text-zinc-500">
									<p>Klik untuk upload file (PDF, JPG, PNG)</p>
									<p className="mt-1 text-zinc-400">Ukuran max: 5MB</p>
								</div>
							)}
						</label>
					</div>
				</div>

				<div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 border border-blue-100">
					Informasi pembelian ini akan muncul di detail customer setelah upload selesai.
				</div>

				<div className="flex justify-end gap-2 pt-1">
					<Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
						Batal
					</Button>
					<Button
						size="sm"
						onClick={handleSave}
						disabled={loading}
						icon={loading ? <Loader2 size={13} className="animate-spin" /> : undefined}
						iconPosition="left">
						{loading ? "Menyimpan..." : "Simpan & Lanjut"}
					</Button>
				</div>
			</div>
		</Modal>
	);
}

// ── Create Unknown Item Codes Modal ──
interface UnknownItemCode {
	code: string;
	count: number;
}

interface ItemCodeForm {
	code: string;
	productTypeName: string;
	categoryId: string;
	warrantyDurationMonths: number;
}

function CreateUnknownItemCodesModal({
	open,
	onClose,
	unknownCodes,
	parsedItems,
	onSuccess,
}: {
	open: boolean;
	onClose: () => void;
	unknownCodes: UnknownItemCode[];
	parsedItems?: ParsedItem[];
	onSuccess: (itemCodes: PendingItemCode[]) => void;
}) {
	const [forms, setForms] = useState<ItemCodeForm[]>([]);
	const [categories, setCategories] = useState<CategorySchema[]>([]);
	const [loading, setLoading] = useState(false);
	const { error: toastError } = useToast();

	// Load categories when modal opens
	React.useEffect(() => {
		if (open) {
			loadCategories();
			initializeForms();
		}
	}, [open]);

	const loadCategories = async () => {
		try {
			const result = await productCateogoryApi.getAll();
			if (result.success && result.data) {
				setCategories(result.data);
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Gagal load kategori";
			toastError("Error", msg);
		}
	};

	const initializeForms = () => {
		setForms(
			unknownCodes.map((item) => {
				// Find itemDescription from parsedItems
				const parsedItem = parsedItems?.find((p) => p.itemCode === item.code);
				return {
					code: item.code,
					productTypeName: parsedItem?.itemDescription || "",
					categoryId: "",
					warrantyDurationMonths: 12,
				};
			}),
		);
	};

	const updateForm = (
		index: number,
		field: keyof ItemCodeForm,
		value: any,
	) => {
		setForms((prev) => {
			const updated = [...prev];
			updated[index] = { ...updated[index], [field]: value };
			return updated;
		});
	};

	const handleValidateAndSave = async () => {
		// Validate all forms
		const validForms = forms.every(
			(f) => f.productTypeName.trim() && f.categoryId,
		);
		if (!validForms) {
			toastError("Validasi", "Harap lengkapi semua nama produk dan kategori");
			return;
		}

		setLoading(true);
		try {
			// Convert forms to pending item codes (no creation yet)
			const pendingItemCodes: PendingItemCode[] = forms.map((form) => ({
				code: form.code,
				productTypeName: form.productTypeName.trim(),
				categoryId: form.categoryId,
				warrantyDurationMonths: form.warrantyDurationMonths,
			}));

			// Pass pending item codes to parent
			onSuccess(pendingItemCodes);
			onClose();
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Gagal memproses item codes";
			toastError("Error", msg);
		} finally {
			setLoading(false);
		}
	};

	if (unknownCodes.length === 0) return null;

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Buat Item Code Baru"
			description={`${unknownCodes.length} item code tidak dikenali`}
			size="lg">
			<div className="space-y-4 max-h-96 overflow-y-auto">
				{forms.map((form, idx) => (
					<div key={form.code} className="border border-zinc-200 rounded-xl p-3">
						<p className="text-xs font-medium text-zinc-600 mb-2">
							Item Code: <span className="font-mono">{form.code}</span> ({unknownCodes[idx]?.count || 0} unit)
						</p>
						<div className="grid grid-cols-2 gap-2">
							<Input
								label="Nama Tipe Produk"
								value={form.productTypeName}
								onChange={(e) =>
									updateForm(idx, "productTypeName", e.target.value)
								}
								placeholder="Contoh: KDS 2215W"
								required
							/>
							<div>
								<label className="text-xs font-medium text-zinc-700 mb-1.5 block">
									Kategori
								</label>
								<select
									value={form.categoryId}
									onChange={(e) =>
										updateForm(idx, "categoryId", e.target.value)
									}
									className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									required>
									<option value="">-- Pilih Kategori --</option>
									{categories.map((c) => (
										<option key={c.id} value={c.id}>
											{c.name}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className="mt-2">
							<Input
								label="Garansi (bulan)"
								type="number"
								value={form.warrantyDurationMonths}
								onChange={(e) =>
									updateForm(
										idx,
										"warrantyDurationMonths",
										parseInt(e.target.value) || 12,
									)
								}
								min="1"
							/>
						</div>
					</div>
				))}
			</div>

			<div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 mt-4">
				<Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
					Batal
				</Button>
				<Button
					size="sm"
					onClick={handleValidateAndSave}
					disabled={loading}
					icon={loading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
					iconPosition="left">
					{loading ? "Validasi..." : `Simpan ${forms.length} Item Code`}
				</Button>
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
	onCreateItemCodes,
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
	onCreateItemCodes: (id: string) => void;
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
					{qf.unknownCount > 0 && !qf.itemCodesHandled && (
						<div className="flex gap-2 items-start p-3 bg-amber-50 border border-amber-100 rounded-xl">
							<AlertTriangle
								size={13}
								className="text-amber-500 shrink-0 mt-0.5"
							/>
							<div className="flex-1">
								<p className="text-xs font-medium text-amber-800">
									Ada {qf.unknownCount} item code yang belum dikenali
								</p>
								<p className="text-xs text-amber-700 mt-0.5">
									Anda bisa membuat item code baru atau
									{" "}
									<a
										href="/dashboard/product-types"
										target="_blank"
										className="underline">
										tambahkan mapping manual
									</a>
									.
								</p>
							</div>
							<Button
								size="xs"
								onClick={() => onCreateItemCodes(qf.id)}
								icon={<Plus size={11} />}>
								Buat Item Code
							</Button>
						</div>
					)}

					{/* Item codes handled - show next step message */}
					{qf.unknownCount > 0 && qf.itemCodesHandled && (
						<div className="flex gap-2 items-start p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
							<CheckCircle size={13} className="text-emerald-500 shrink-0 mt-0.5" />
							<div className="flex-1">
								<p className="text-xs font-medium text-emerald-800">
									{qf.pendingItemCodes?.length || 0} item code siap untuk dibuat
								</p>
								<p className="text-xs text-emerald-700 mt-0.5">
									Item codes akan dibuat saat upload selesai. Lanjutkan dengan memilih dealer atau end customer.
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
										Item Code / Nama Produk
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
											<div className="flex flex-col gap-0.5">
												{r.itemCodeOriginal && (
													<span className="font-mono text-[10px] text-zinc-500">
														{r.itemCodeOriginal}
													</span>
												)}
												{r.itemDescription && (
													<span className="text-[11px] text-zinc-700 font-medium">
														{r.itemDescription}
													</span>
												)}
											</div>
										</td>
										<td className="px-3 py-2 text-zinc-600">
											{r.productType || (
												<span className="text-amber-600 italic text-[11px]">
													—
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

					{/* No valid products warning */}
					{qf.preview && qf.validCount === 0 && qf.unknownCount === 0 && (
						<div className="flex gap-2 items-start p-3 bg-amber-50 border border-amber-100 rounded-xl">
							<AlertTriangle
								size={13}
								className="text-amber-500 shrink-0 mt-0.5"
							/>
							<div className="flex-1">
								<p className="text-xs font-medium text-amber-800">
									Semua produk adalah duplikat
								</p>
								<p className="text-xs text-amber-700 mt-0.5">
									Tidak ada produk valid untuk disimpan
								</p>
							</div>
						</div>
					)}

					{/* Destination */}
					{qf.preview && qf.preview.length > 0 && (qf.validCount > 0 || (qf.unknownCount > 0 && qf.itemCodesHandled)) && (
						<div className="space-y-3">
							{/* Guide after item codes handled */}
							{qf.itemCodesHandled && (
								<div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
									<div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
										2
									</div>
									<div className="flex-1">
										<p className="text-xs font-medium text-blue-900">Langkah 2: Pilih Destinasi</p>
										<p className="text-xs text-blue-700 mt-1">Pilih apakah produk ini untuk Dealer atau End Customer</p>
									</div>
								</div>
							)}

							<p className="text-xs font-medium text-zinc-700">
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
									onClick={() => {
											if (qf.destType === "dealer" && qf.destLabel) {
												if (confirm("Mengganti ke End Customer akan membatalkan pilihan dealer. Lanjutkan?")) {
													setQueue((prev) =>
														prev.map((q) =>
															q.id === qf.id ? { ...q, destType: "customer", destLabel: undefined, pendingDealerCreation: undefined } : q,
														),
													);
												}
											} else {
												onDestSelect(qf.id, "customer");
											}
										}}
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

					{/* Customer confirmed label */}
					{qf.destType === "customer" && qf.destLabel && (
						<div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
							<CheckCircle size={13} />
							Customer: <span className="font-medium">{qf.destLabel}</span>
						</div>
					)}

					{/* Pending creations indicators */}
					{(qf.pendingDealerCreation || qf.pendingCustomerCreation || qf.pendingItemCodes?.length) && (
						<div className="space-y-2 text-xs">
							{qf.pendingDealerCreation && (
								<div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-blue-700">
									<Plus size={12} />
									<span>Dealer baru akan dibuat: <span className="font-medium">{qf.pendingDealerCreation.name}</span></span>
								</div>
							)}
							{qf.pendingCustomerCreation && (
								<div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-blue-700">
									<Plus size={12} />
									<span>Customer baru akan dibuat: <span className="font-medium">{qf.pendingCustomerCreation.name}</span></span>
								</div>
							)}
							{qf.pendingItemCodes && qf.pendingItemCodes.length > 0 && (
								<div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-100 rounded-lg text-purple-700">
									<Plus size={12} />
									<span>{qf.pendingItemCodes.length} item code baru akan dibuat</span>
								</div>
							)}
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
						{qf.preview && qf.preview.length > 0 && (
							<Button
								size="sm"
								onClick={() => onSubmit(qf.id)}
								disabled={
									!qf.destType || (qf.destType === "dealer" && !qf.destLabel)
								}
								icon={<ChevronRight size={13} />}
								iconPosition="right">
								Submit File Ini ({qf.validCount + qf.unknownCount} produk)
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
	const [showFuzzyCustomer, setShowFuzzyCustomer] = useState(false);
	const [showNewDealer, setShowNewDealer] = useState(false);
	const [showNewCustomer, setShowNewCustomer] = useState(false);
	const [showCreateItemCodes, setShowCreateItemCodes] = useState(false);
	const [showPurchaseForm, setShowPurchaseForm] = useState(false);
	const [unknownItemCodes, setUnknownItemCodes] = useState<UnknownItemCode[]>([]);
	const [pendingParsedItems, setPendingParsedItems] = useState<ParsedItem[] | undefined>(undefined);
	const [pendingItemCodesId, setPendingItemCodesId] = useState<string | null>(null);
	const [pendingFuzzyId, setPendingFuzzyId] = useState<string | null>(null);
	const [suggestedShipTo, setSuggestedShipTo] = useState<string>("");
	const [finished, setFinished] = useState(false);
	const { success, error: toastError } = useToast();

	const KNOWN_HASHES = ["hash_DO-already-uploaded.xlsx_12345"]; // mock

	const extractUnknownCodes = (preview: PreviewRow[]): UnknownItemCode[] => {
		const codeMap = new Map<string, number>();
		preview.forEach((row) => {
			if (row.status === "unknown_type" && row.itemCodeOriginal) {
				codeMap.set(
					row.itemCodeOriginal,
					(codeMap.get(row.itemCodeOriginal) || 0) + 1,
				);
			}
		});
		return Array.from(codeMap.entries()).map(([code, count]) => ({
			code,
			count,
		}));
	};

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
		const queueFile = queue.find((q) => q.id === id);
		if (!queueFile) return;

		setQueue((prev) =>
			prev.map((q) => (q.id === id ? { ...q, state: "processing" } : q)),
		);

		try {
			const result = await uploadApi.validateAccurateFile(queueFile.file);

			if (!result.success) {
				throw new Error(result.message || "Validasi gagal");
			}

			const data = result.data!;

			setQueue((prev) =>
				prev.map((q) =>
					q.id === id
						? {
								...q,
								state: "previewing",
								preview: data.preview,
								parsedItems: data.parsedItems,
								validCount: data.validCount,
								dupCount: data.dupCount,
								unknownCount: data.unknownCount,
								// Preserve existing destination selection
								destType: queueFile.destType,
								destLabel: queueFile.destLabel,
								// Store parsed data for fuzzy matching
								shipTo: data.shipTo || queueFile.shipTo,
								doNumber: data.doNumber || queueFile.doNumber,
							}
						: q,
				),
			);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Gagal memvalidasi file";
			setQueue((prev) =>
				prev.map((q) =>
					q.id === id
						? { ...q, state: "error", errorMessage: message }
						: q,
				),
			);
			toastError("Validasi gagal", message);
			advanceQueue(id);
		}
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
				q.id === id
					? {
							...q,
							destType: type,
							destLabel: undefined,
							pendingDealerCreation: type === "customer" ? undefined : q.pendingDealerCreation,
							pendingCustomerCreation: type === "dealer" ? undefined : q.pendingCustomerCreation,
						}
					: q,
			),
		);
		if (type === "dealer") {
			const qf = queue.find((q) => q.id === id);
			setSuggestedShipTo(qf?.shipTo || "");
			setPendingFuzzyId(id);
			setShowFuzzy(true);
		} else if (type === "customer") {
			const qf = queue.find((q) => q.id === id);
			setSuggestedShipTo(qf?.shipTo || "");
			setPendingFuzzyId(id);
			setShowFuzzyCustomer(true);
		}
	};

	const handleFuzzySelect = (dealerId: string, dealerName: string) => {
		if (pendingFuzzyId) {
			setQueue((prev) =>
				prev.map((q) =>
					q.id === pendingFuzzyId
						? { ...q, destLabel: dealerName, pendingDealerCreation: undefined }
						: q,
				),
			);
		}
		setShowFuzzy(false);
		setPendingFuzzyId(null);
	};

	const handleFuzzyCustomerSelect = (customerName: string) => {
		if (pendingFuzzyId) {
			setQueue((prev) =>
				prev.map((q) =>
					q.id === pendingFuzzyId
						? { ...q, destLabel: customerName, pendingCustomerCreation: undefined }
						: q,
				),
			);
		}
		setShowFuzzyCustomer(false);
		// Open purchase form after customer selection
		setShowPurchaseForm(true);
	};

	const handleFuzzyCustomerCreateNew = () => {
		setShowFuzzyCustomer(false);
		setShowNewCustomer(true);
	};

	const handlePurchaseFormSave = (purchaseData: PurchaseData) => {
		if (pendingFuzzyId) {
			setQueue((prev) =>
				prev.map((q) =>
					q.id === pendingFuzzyId ? { ...q, purchaseData } : q,
				),
			);
		}
		setShowPurchaseForm(false);
	};

	const handleFuzzyNewDealer = () => {
		setShowFuzzy(false);
		setShowNewDealer(true);
	};

	const handleNewDealerSave = (dealerData: PendingDealerCreation) => {
		if (pendingFuzzyId) {
			setQueue((prev) =>
				prev.map((q) =>
					q.id === pendingFuzzyId
						? {
								...q,
								destLabel: dealerData.name,
								pendingDealerCreation: dealerData,
							}
						: q,
				),
			);
		}
		setShowNewDealer(false);
		setPendingFuzzyId(null);
	};

	const handleNewCustomerSave = (customerData: PendingCustomerCreation) => {
		if (pendingFuzzyId) {
			setQueue((prev) =>
				prev.map((q) =>
					q.id === pendingFuzzyId
						? {
								...q,
								destLabel: customerData.name,
								pendingCustomerCreation: customerData,
							}
						: q,
				),
			);
		}
		setShowNewCustomer(false);
		// Open purchase form after customer creation
		setShowPurchaseForm(true);
	};

	const handleOpenCreateItemCodes = (id: string) => {
		const qf = queue.find((q) => q.id === id);
		if (qf?.preview) {
			const unknown = extractUnknownCodes(qf.preview);
			setUnknownItemCodes(unknown);
			setPendingParsedItems(qf.parsedItems);
			setPendingItemCodesId(id);
			setShowCreateItemCodes(true);
		}
	};

	const handleItemCodesCreated = (itemCodes: PendingItemCode[]) => {
		if (pendingItemCodesId) {
			setQueue((prev) =>
				prev.map((q) =>
					q.id === pendingItemCodesId
						? { ...q, pendingItemCodes: itemCodes, itemCodesHandled: true }
						: q,
				),
			);
			setPendingItemCodesId(null);
			setPendingParsedItems(undefined);
		}
	};

	const submitFile = async (id: string) => {
		const queueFile = queue.find((q) => q.id === id);
		if (!queueFile) return;

		setQueue((prev) =>
			prev.map((q) => (q.id === id ? { ...q, state: "submitting" } : q)),
		);

		try {
			const result = await uploadApi.uploadAccurateFile(
				queueFile.file,
				queueFile.destType as "dealer" | "customer",
				queueFile.destLabel || "",
				queueFile.pendingDealerCreation,
				queueFile.pendingCustomerCreation,
				queueFile.pendingItemCodes,
				queueFile.purchaseData,
			);

			if (!result.success) {
				throw new Error(result.message || "Upload gagal");
			}

			setQueue((prev) =>
				prev.map((q) => (q.id === id ? { ...q, state: "done" } : q)),
			);
			advanceQueue(id);
			success(
				"File berhasil diupload",
				`${queueFile.validCount} produk ditambahkan`,
			);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Gagal mengupload file";
			setQueue((prev) =>
				prev.map((q) =>
					q.id === id ? { ...q, state: "error", errorMessage: message } : q,
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
										onCreateItemCodes={handleOpenCreateItemCodes}
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
				shipTo={
					pendingFuzzyId
						? queue.find((q) => q.id === pendingFuzzyId)?.shipTo || "Unknown"
						: "Unknown"
				}
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
				suggestedName={suggestedShipTo}
			/>
			<FuzzyCustomerModal
				open={showFuzzyCustomer}
				shipTo={
					pendingFuzzyId
						? queue.find((q) => q.id === pendingFuzzyId)?.shipTo || "Unknown"
						: "Unknown"
				}
				onSelect={handleFuzzyCustomerSelect}
				onCreateNew={handleFuzzyCustomerCreateNew}
				onClose={() => {
					setShowFuzzyCustomer(false);
					setPendingFuzzyId(null);
				}}
			/>
			<NewCustomerModal
				open={showNewCustomer}
				onClose={() => setShowNewCustomer(false)}
				onSave={handleNewCustomerSave}
				suggestedName={suggestedShipTo}
			/>
			<CreateUnknownItemCodesModal
				open={showCreateItemCodes}
				unknownCodes={unknownItemCodes}
				parsedItems={pendingParsedItems}
				onClose={() => {
					setShowCreateItemCodes(false);
					setPendingItemCodesId(null);
					setPendingParsedItems(undefined);
				}}
				onSuccess={handleItemCodesCreated}
			/>
			<PurchaseFormModal
				open={showPurchaseForm}
				onClose={() => setShowPurchaseForm(false)}
				onSave={handlePurchaseFormSave}
			/>
		</div>
	);
}
