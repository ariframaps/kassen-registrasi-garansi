"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal, ConfirmModal } from "@/components/ui/modal";
// import { Pagination } from "@/components/ui/pagination";
import { ReassignModal } from "@/components/ui/reassign-modal";
import {
	Table,
	TableHead,
	TableHeader,
	TableBody,
	TableRow,
	TableCell,
	EmptyState,
} from "@/components/ui/table";
// import { productAdapter, dealerAdapter, PRODUCT_CATEGORIES } from "@/lib/adapters";
// import {
// 	mockProducts,
// 	mockDealers,
// 	PRODUCT_CATEGORIES,
// } from "@/mock/mock-data";
import { conditionsStore, setCondition } from "@/lib/warranty-conditions.store";
import type { ConditionEntry } from "@/lib/warranty-conditions.store";
import {
	getProductStatusLabel,
	getProductStatusBadgeVariant,
	formatDateShort,
	getDaysRemaining,
} from "@/lib/utils";
import {
	Search,
	Eye,
	Shield,
	Package,
	X,
	Check,
	Link2,
	AlertTriangle,
	CheckCircle2,
	XCircle,
	RotateCcw,
	Wrench,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/_auth-provider";
// import type { Product } from "@/types";
import { authClient } from "@/lib/auth-client";
import { CategorySchema, DealerSchema, ProductSchema } from "@/db/schema";
import {
	dealerApi,
	productApi,
	productCateogoryApi,
} from "@/lib/api/api-client";
import { ProductStatus } from "@/types";
import { ProductWithNestedSchema } from "@/services/product.service";

// ── Warranty Condition Badge ──
function ConditionBadge({ sn }: { sn: string }) {
	const c = conditionsStore[sn];
	if (!c || c.warrantyCondition === "valid")
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

// ── Condition Update Modal (admin) ──
function AdminConditionModal({
	product,
	onClose,
	onSave,
}: {
	product: ProductWithNestedSchema;
	onClose: () => void;
	onSave: (d: ConditionEntry) => void;
}) {
	const current = conditionsStore[product.serialNumber];
	const [status, setStatus] = useState<"valid" | "rejected">(
		current?.warrantyCondition === "rejected" ? "rejected" : "valid",
	);
	const [note, setNote] = useState(current?.warrantyConditionNote ?? "");
	const [confirmOpen, setConfirm] = useState(false);
	const [loading, setLoading] = useState(false);
	const { success, error } = useToast();

	const handleSave = async () => {
		setLoading(true);
		try {
			await productApi.updateWarrantyStatus({
				serialNumber: product.serialNumber,
				condition: status,
				reason: note.trim(),
			});

			onSave({
				warrantyCondition: status,
				warrantyConditionNote: note.trim(),
				warrantyConditionUpdatedAt: new Date().toISOString().slice(0, 10),
				warrantyConditionUpdatedBy: "Admin",
			});
			setConfirm(false);
			onClose();
			success(
				status === "valid" ? "Kondisi: Valid" : "Kondisi: Rejected",
				`SN ${product.serialNumber}`,
			);
		} catch (err) {
			error("Gagal", "Terjadi kesalahan saat menyimpan kondisi");
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Modal
				open
				onClose={onClose}
				title="Update Kondisi Garansi"
				description={product.serialNumber}
				size="md">
				<div className="space-y-4">
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
										size={17}
										className={
											status === "valid" ? "text-emerald-500" : "text-zinc-300"
										}
									/>
								) : (
									<XCircle
										size={17}
										className={
											status === "rejected" ? "text-red-500" : "text-zinc-300"
										}
									/>
								)}
								<div>
									<p
										className={`text-xs font-semibold ${status === s ? (s === "valid" ? "text-emerald-700" : "text-red-700") : "text-zinc-600"}`}>
										{s === "valid" ? "Valid" : "Rejected"}
									</p>
									<p className="text-[11px] text-zinc-400">
										{s === "valid"
											? "Garansi berlaku"
											: "Tidak memenuhi syarat"}
									</p>
								</div>
							</button>
						))}
					</div>
					<div>
						<label className="block text-xs font-medium text-zinc-700 mb-1.5">
							{status === "rejected" ? (
								<>
									Alasan <span className="text-red-500">*</span>
								</>
							) : (
								"Catatan (opsional)"
							)}
						</label>
						<textarea
							value={note}
							onChange={(e) => setNote(e.target.value)}
							rows={3}
							className={`w-full px-3 py-2 text-sm bg-white border rounded-lg outline-none transition-all resize-none ${status === "rejected" && !note.trim() ? "border-red-300" : "border-zinc-200 focus:border-blue-500"}`}
							placeholder={
								status === "rejected"
									? "Alasan tidak memenuhi syarat…"
									: "Catatan kondisi…"
							}
						/>
						{status === "rejected" && !note.trim() && (
							<p className="text-xs text-red-600 mt-1">Alasan wajib diisi</p>
						)}
					</div>
					{status === "rejected" && (
						<div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
							<AlertTriangle
								size={13}
								className="text-amber-600 shrink-0 mt-0.5"
							/>
							<p className="text-[11px] text-amber-700">
								Status Rejected = garansi tidak bisa diklaim meski masih aktif.
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
							onClick={() => setConfirm(true)}>
							Simpan Kondisi
						</Button>
					</div>
				</div>
			</Modal>
			<ConfirmModal
				open={confirmOpen}
				onClose={() => setConfirm(false)}
				onConfirm={handleSave}
				title={`Ubah kondisi ke ${status === "valid" ? "Valid" : "Rejected"}?`}
				description={
					status === "rejected"
						? `SN ${product.serialNumber} akan ditandai Rejected. Alasan: "${note}"`
						: `SN ${product.serialNumber} dikembalikan ke Valid.`
				}
				confirmLabel={status === "rejected" ? "Ya, Reject" : "Ya, Valid"}
				variant={status === "rejected" ? "danger" : "primary"}
				loading={loading}
			/>
		</>
	);
}

// ── Warranty Registration Modal ──
function WarrantyModal({
	products,
	onClose,
	isOpen = false,
}: {
	products: ProductWithNestedSchema[];
	onClose: () => void;
	isOpen: boolean;
}) {
	const [form, setForm] = useState({
		customerName: "",
		phone: "",
		email: "",
		warrantyStart: "",
		invoiceFile: null as File | null,
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [confirmOpen, setConfirm] = useState(false);
	const [loading, setLoading] = useState(false);
	const { success } = useToast();

	const validate = () => {
		const e: Record<string, string> = {};
		if (!form.customerName) e.customerName = "Wajib diisi";
		if (!form.phone) e.phone = "Wajib diisi";
		if (!form.email) e.email = "Wajib diisi";
		if (!form.warrantyStart) e.warrantyStart = "Wajib diisi";
		if (!form.invoiceFile) e.invoiceFile = "Invoice wajib diunggah";
		setErrors(e);
		return Object.keys(e).length === 0;
	};

	const groupId =
		form.customerName && form.warrantyStart
			? `GRP-${form.customerName.slice(0, 3).toUpperCase()}-${form.warrantyStart.replace(/-/g, "").slice(2)}`
			: null;

	const handleSubmit = async () => {
		setLoading(true);
		await new Promise((r) => setTimeout(r, 900));
		setLoading(false);
		setConfirm(false);
		onClose();
		success(
			"Garansi berhasil diregistrasikan",
			`${products.length} produk · Grup ${groupId}`,
		);
	};

	return (
		<>
			<Modal
				open={isOpen}
				onClose={onClose}
				title="Registrasi Garansi"
				description={`${products.length} produk dipilih`}
				size="md">
				<div className="space-y-3">
					<div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
						<div className="flex flex-wrap gap-1.5 mb-2">
							{products.map((p) => (
								<span
									key={p.id}
									className="font-mono text-[11px] bg-white border border-zinc-200 px-2 py-0.5 rounded-md text-zinc-600">
									{p.serialNumber}
								</span>
							))}
						</div>
						<p className="text-[11px] text-amber-600">
							⚠ Semua produk menggunakan 1 data customer &amp; 1 invoice
						</p>
						{groupId && (
							<p className="text-[11px] text-zinc-400 mt-1">
								Grup: <span className="font-mono text-blue-600">{groupId}</span>
							</p>
						)}
					</div>
					<Input
						label="Nama Customer"
						placeholder="Nama lengkap"
						required
						value={form.customerName}
						onChange={(e) => setForm({ ...form, customerName: e.target.value })}
						error={errors.customerName}
					/>
					<div className="grid grid-cols-2 gap-3">
						<Input
							label="No. HP"
							type="tel"
							placeholder="08xx-xxxx-xxxx"
							required
							value={form.phone}
							onChange={(e) => setForm({ ...form, phone: e.target.value })}
							error={errors.phone}
						/>
						<Input
							label="Email"
							type="email"
							placeholder="email@contoh.com"
							required
							value={form.email}
							onChange={(e) => setForm({ ...form, email: e.target.value })}
							error={errors.email}
						/>
					</div>
					<Input
						label="Tanggal Terjual (= Mulai Garansi)"
						type="date"
						required
						value={form.warrantyStart}
						onChange={(e) =>
							setForm({ ...form, warrantyStart: e.target.value })
						}
						error={errors.warrantyStart}
						hint="Tanggal ini menjadi tanggal mulai garansi"
					/>
					<div>
						<label className="block text-xs font-medium text-zinc-700 mb-1.5">
							Invoice <span className="text-red-500">*</span>
						</label>
						<label
							className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${form.invoiceFile ? "border-emerald-400 bg-emerald-50" : "border-zinc-200 hover:border-zinc-300 bg-zinc-50"}`}>
							{form.invoiceFile ? (
								<div className="flex items-center gap-2 text-emerald-700">
									<Check size={14} />
									<span className="text-xs font-medium">
										{form.invoiceFile.name}
									</span>
									<button
										type="button"
										onClick={(e) => {
											e.preventDefault();
											setForm({ ...form, invoiceFile: null });
										}}>
										<X size={11} />
									</button>
								</div>
							) : (
								<p className="text-xs text-zinc-400">
									Klik untuk upload — PNG, JPG, PDF
								</p>
							)}
							<input
								type="file"
								accept=".png,.jpg,.jpeg,.pdf"
								className="sr-only"
								onChange={(e) => {
									const f = e.target.files?.[0];
									if (f) setForm({ ...form, invoiceFile: f });
								}}
							/>
						</label>
						{errors.invoiceFile && (
							<p className="mt-1 text-xs text-red-600">{errors.invoiceFile}</p>
						)}
					</div>
					<div className="flex gap-2 pt-1">
						<Button variant="outline" fullWidth onClick={onClose}>
							Batal
						</Button>
						<Button
							fullWidth
							icon={<Shield size={13} />}
							onClick={() => {
								if (validate()) setConfirm(true);
							}}>
							Registrasikan
						</Button>
					</div>
				</div>
			</Modal>
			<ConfirmModal
				open={confirmOpen}
				onClose={() => setConfirm(false)}
				onConfirm={handleSubmit}
				title="Konfirmasi Registrasi Garansi"
				description={`${products.length} produk akan didaftarkan garansinya atas nama ${form.customerName}. Grup: ${groupId}`}
				confirmLabel="Ya, Registrasikan"
				loading={loading}
			/>
		</>
	);
}

// ── Bulk Assign Modal ──
// function BulkAssignModal({
// 	open,
// 	onClose,
// }: {
// 	open: boolean;
// 	onClose: () => void;
// }) {
// 	const products = mockProducts;
// 	const [search, setSearch] = useState("");
// 	const [selectedSNs, setSelectedSNs] = useState<string[]>([]);
// 	const [dealerId, setDealer] = useState("");
// 	const [confirmOpen, setConfirm] = useState(false);
// 	const [loading, setLoading] = useState(false);
// 	const { success } = useToast();

// 	const assignable = products.filter(
// 		(p) =>
// 			p.status === "uploaded_by_sales" &&
// 			(p.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
// 				p.productType.toLowerCase().includes(search.toLowerCase()) ||
// 				p.productCategory.toLowerCase().includes(search.toLowerCase())),
// 	);

// 	const toggle = (sn: string) =>
// 		setSelectedSNs((prev) =>
// 			prev.includes(sn) ? prev.filter((s) => s !== sn) : [...prev, sn],
// 		);

// 	const handleAssign = async () => {
// 		setLoading(true);
// 		await new Promise((r) => setTimeout(r, 800));
// 		setLoading(false);
// 		setConfirm(false);
// 		onClose();
// 		setSelectedSNs([]);
// 		setDealer("");
// 		setSearch("");
// 		success(
// 			`${selectedSNs.length} produk di-assign`,
// 			`ke ${mockDealers.find((d) => d.id === dealerId)?.name}`,
// 		);
// 	};

// 	return (
// 		<>
// 			<Modal
// 				open={open}
// 				onClose={onClose}
// 				title="Assign Produk ke Dealer"
// 				size="xl">
// 				<div className="space-y-4">
// 					<Select
// 						label="Dealer Tujuan"
// 						required
// 						options={mockDealers
// 							.filter((d) => d.status === "active")
// 							.map((d) => ({ value: d.id, label: d.name }))}
// 						placeholder="Pilih dealer..."
// 						value={dealerId}
// 						onChange={(e) => setDealer(e.target.value)}
// 					/>
// 					<div className="flex gap-2 items-center">
// 						<div className="flex-1">
// 							<Input
// 								placeholder="Cari SN, tipe, atau kategori…"
// 								value={search}
// 								onChange={(e) => setSearch(e.target.value)}
// 								leftIcon={<Search size={13} />}
// 							/>
// 						</div>
// 						<button
// 							onClick={() =>
// 								setSelectedSNs(assignable.map((p) => p.serialNumber))
// 							}
// 							className="text-xs text-blue-600 hover:underline whitespace-nowrap px-1">
// 							Pilih Semua
// 						</button>
// 						{selectedSNs.length > 0 && (
// 							<button
// 								onClick={() => setSelectedSNs([])}
// 								className="text-xs text-zinc-400 hover:text-zinc-600 whitespace-nowrap">
// 								Batal Semua
// 							</button>
// 						)}
// 					</div>
// 					<div className="border border-zinc-100 rounded-xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-zinc-50">
// 						{assignable.length === 0 ? (
// 							<div className="py-8 text-center text-xs text-zinc-400">
// 								Tidak ada produk yang bisa di-assign
// 							</div>
// 						) : (
// 							assignable.map((p) => {
// 								const sel = selectedSNs.includes(p.serialNumber);
// 								return (
// 									<button
// 										key={p.id}
// 										onClick={() => toggle(p.serialNumber)}
// 										className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${sel ? "bg-blue-50" : "hover:bg-zinc-50"}`}>
// 										<div
// 											className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${sel ? "bg-blue-600 border-blue-600" : "border-zinc-300"}`}>
// 											{sel && (
// 												<Check
// 													size={9}
// 													className="text-white"
// 													strokeWidth={3}
// 												/>
// 											)}
// 										</div>
// 										<div className="flex-1 min-w-0">
// 											<p className="font-mono text-xs font-semibold text-zinc-800">
// 												{p.serialNumber}
// 											</p>
// 											<p className="text-[11px] text-zinc-400">
// 												{p.productType} · {p.productCategory}
// 											</p>
// 										</div>
// 									</button>
// 								);
// 							})
// 						)}
// 					</div>
// 					{selectedSNs.length > 0 && (
// 						<div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
// 							<p className="text-xs font-medium text-blue-700 mb-2">
// 								{selectedSNs.length} produk dipilih
// 							</p>
// 							<div className="flex flex-wrap gap-1.5">
// 								{selectedSNs.map((sn) => (
// 									<span
// 										key={sn}
// 										className="inline-flex items-center gap-1 bg-white border border-blue-200 px-2 py-0.5 rounded-md text-[11px] font-mono text-blue-700">
// 										{sn}
// 										<button onClick={() => toggle(sn)}>
// 											<X size={9} />
// 										</button>
// 									</span>
// 								))}
// 							</div>
// 						</div>
// 					)}
// 					<div className="flex gap-2 pt-1">
// 						<Button variant="outline" fullWidth onClick={onClose}>
// 							Batal
// 						</Button>
// 						<Button
// 							fullWidth
// 							disabled={selectedSNs.length === 0 || !dealerId}
// 							icon={<Link2 size={13} />}
// 							onClick={() => setConfirm(true)}>
// 							Assign ({selectedSNs.length})
// 						</Button>
// 					</div>
// 				</div>
// 			</Modal>
// 			<ConfirmModal
// 				open={confirmOpen}
// 				onClose={() => setConfirm(false)}
// 				onConfirm={handleAssign}
// 				title="Konfirmasi Assign"
// 				description={`${selectedSNs.length} produk akan di-assign ke ${mockDealers.find((d) => d.id === dealerId)?.name ?? "dealer"}. Tidak bisa dibatalkan.`}
// 				confirmLabel="Ya, Assign"
// 				loading={loading}
// 			/>
// 		</>
// 	);
// }

// ── Main Page ──
export default function ProductsPage() {
	const [products, setProducts] = useState<ProductWithNestedSchema[]>([]);
	const [categories, setCategories] = useState<CategorySchema[]>([]);
	const [dealers, setDealers] = useState<DealerSchema[]>([]);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">(
		"all",
	);
	const [dealerFilter, setDealerFilter] = useState("all");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [selectedProduct, setSelectedProduct] =
		useState<ProductWithNestedSchema | null>(null);
	const [conditionTarget, setConditionTarget] =
		useState<ProductWithNestedSchema | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);
	const [bulkAssignOpen, setBulkAssign] = useState(false);
	const [warrantySelectMode, setWarrantyMode] = useState(false);
	const [warrantySelected, setWarrantySelected] = useState<string[]>([]);
	const [warrantyModalOpen, setWarrantyModal] = useState(false);
	const [, forceUpdate] = useState(0);

	const { data: session } = authClient.useSession();
	const user = session?.user;
	const canEdit = user?.role === "sales" || user?.role === "admin";
	const isAdmin = user?.role === "admin";
	const canUpdateWarrantyCondition = user?.role === "admin" || user?.role === "technical_support";
	const [productPage, setProductPage] = useState(1);
	const [productPageSize, setProductPageSize] = useState(20);
	// const [reassignTarget, setReassignTarget] =
	// 	useState<ProductWithNestedSchema | null>(null);

	const filtered = useMemo(() => {
		const q = search.toLowerCase();
		return products.filter((p) => {
			const matchSearch =
				p.serialNumber.toLowerCase().includes(q) ||
				p.productType.name.toLowerCase().includes(q) ||
				p.productType.category.name.toLowerCase().includes(q);
			const matchStatus = statusFilter === "all" || p.status === statusFilter;
			const matchDealer =
				dealerFilter === "all" ||
				(dealerFilter === "none" ? !p.dealerId : p.dealerId === dealerFilter);
			const matchCategory =
				categoryFilter === "all" || p.productType.categoryId === categoryFilter;
			return matchSearch && matchStatus && matchDealer && matchCategory;
		});
	}, [search, statusFilter, dealerFilter, categoryFilter, products]);

	const toggleWarranty = (id: string) =>
		setWarrantySelected((prev) =>
			prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
		);
	// const canRegister = (p: ProductWithNestedSchema) =>
	// 	!p.dealerId && p.status === "unassigned";
	const warrantyProducts = products.filter((p) =>
		warrantySelected.includes(p.id),
	);

	// Auto-filter when entering warranty select mode
	// const enterWarrantyMode = () => {
	// 	setWarrantyMode(true);
	// 	setStatusFilter("all");
	// 	setDealerFilter("none");
	// };

	useEffect(() => {
		Promise.all([
			productApi.getAllWithNested(),
			productCateogoryApi.getAll(),
			dealerApi.getAll(),
		]).then(([p, c, d]) => {
			if (p.success) setProducts(p.data);
			if (c.success) setCategories(c.data);
			if (d.success) setDealers(d.data);
		});
	}, []);

	return (
		<div>
			<Topbar title="Produk" description="Kelola semua serial number produk" />
			<div className="p-6 animate-fade-up">
				<Card>
					<div className="px-5 py-3.5 border-b border-zinc-100 flex flex-wrap items-center gap-2.5">
						<div className="flex-1 min-w-48 max-w-64">
							<Input
								placeholder="Cari SN, tipe, atau kategori…"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								leftIcon={<Search size={13} />}
							/>
						</div>
						<Select
							options={
								[
									{ value: "all", label: "Semua Status" },
									// { value: "uploaded_by_sales", label: "Di Upload Oleh Sales" },
									// { value: "assigned_to_dealer", label: "Di Dealer" },
									{ value: "none", label: "Belum Diregistrasikan" },
									{ value: "warranty_active", label: "Garansi Aktif" },
									{ value: "warranty_expired", label: "Garansi Berakhir" },
								] as { value: ProductStatus | "all"; label: string }[]
							}
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value as ProductStatus)}
							className="w-48"
						/>
						<Select
							options={[
								{ value: "all", label: "Semua Dealer" },
								{ value: "none", label: "Tanpa Dealer" },
								...dealers.map((d) => ({ value: d.id, label: d.name })),
							]}
							value={dealerFilter}
							onChange={(e) => setDealerFilter(e.target.value)}
							className="w-48"
						/>
						<Select
							options={[
								{ value: "all", label: "Semua Kategori" },
								...categories.map((c) => ({ value: c.id, label: c.name })),
							]}
							value={categoryFilter}
							onChange={(e) => setCategoryFilter(e.target.value)}
							className="w-44"
						/>
						<div className="ml-auto flex items-center gap-2">
							<span className="text-xs text-zinc-400">
								{filtered.length} produk
							</span>
							{/* {canEdit &&
								(warrantySelectMode ? (
									<>
										<Button
											size="sm"
											variant="outline"
											onClick={() => {
												setWarrantyMode(false);
												setWarrantySelected([]);
												setStatus("all");
												setDealer("all");
											}}>
											Batal
										</Button>
										<Button
											size="sm"
											disabled={warrantySelected.length === 0}
											icon={<Shield size={13} />}
											onClick={() => setWarrantyModal(true)}>
											Registrasi ({warrantySelected.length})
										</Button>
									</>
								) : (
									<>
										<Button
											size="sm"
											variant="outline"
											icon={<Link2 size={13} />}
											onClick={() => setBulkAssign(true)}>
											Assign ke Dealer
										</Button>
										<Button
											size="sm"
											icon={<Shield size={13} />}
											onClick={enterWarrantyMode}>
											Registrasi Garansi
										</Button>
									</>
								))} */}
						</div>
					</div>

					{warrantySelectMode && (
						<div className="px-5 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
							<Shield size={13} className="text-blue-600" />
							<p className="text-xs text-blue-700">
								Mode registrasi — sudah difilter ke produk belum terdaftar.
								Pilih yang ingin diregistrasikan.
							</p>
						</div>
					)}

					<CardContent className="p-0">
						<Table>
							<TableHead>
								{warrantySelectMode && <TableHeader className="w-10" />}
								<TableHeader>Serial Number</TableHeader>
								<TableHeader>Tipe Produk</TableHeader>
								<TableHeader>Kategori</TableHeader>
								<TableHeader>Status</TableHeader>
								<TableHeader>Dealer</TableHeader>
								<TableHeader>Mulai Garansi</TableHeader>
								<TableHeader>Kondisi</TableHeader>
								<TableHeader className="text-right pr-5">Aksi</TableHeader>
							</TableHead>
							<TableBody>
								{filtered.length === 0 ? (
									<tr>
										<td colSpan={warrantySelectMode ? 9 : 8}>
											<EmptyState
												icon={<Package size={18} />}
												title="Tidak ada produk"
												description="Ubah filter"
											/>
										</td>
									</tr>
								) : (
									filtered.map((p) => {
										// const selectable = warrantySelectMode && canRegister(p);
										const selectable = warrantySelectMode;
										const sel = warrantySelected.includes(p.id);
										const hasWarranty =
											p.status === "warranty_active" ||
											p.status === "warranty_expired";
										return (
											<TableRow
												key={p.id}
												className={
													warrantySelectMode && selectable
														? "cursor-pointer"
														: ""
												}
												onClick={
													warrantySelectMode && selectable
														? () => toggleWarranty(p.id)
														: undefined
												}>
												{warrantySelectMode && (
													<TableCell>
														{selectable ? (
															<div
																className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${sel ? "bg-blue-600 border-blue-600" : "border-zinc-300"}`}>
																{sel && (
																	<Check
																		size={9}
																		className="text-white"
																		strokeWidth={3}
																	/>
																)}
															</div>
														) : (
															<div className="w-4 h-4 rounded border-2 border-zinc-100 bg-zinc-50" />
														)}
													</TableCell>
												)}
												<TableCell>
													<span className="font-mono text-xs bg-zinc-100 text-zinc-700 px-2 py-1 rounded-md">
														{p.serialNumber}
													</span>
												</TableCell>
												<TableCell>
													<span className="text-xs text-zinc-900">
														{p.productType.name}
													</span>
												</TableCell>
												<TableCell>
													<span className="text-xs text-zinc-500">
														{p.productType.category.name}
													</span>
												</TableCell>
												<TableCell>
													<Badge
														variant={getProductStatusBadgeVariant(p.status)}
														dot>
														{getProductStatusLabel(p.status)}
													</Badge>
												</TableCell>
												<TableCell>
													<span className="text-xs text-zinc-500">
														{p.dealer?.name ?? (
															<span className="text-zinc-300">—</span>
														)}
													</span>
												</TableCell>
												<TableCell>
													<span className="text-xs text-zinc-400">
														{p.warrantyStartDate ? (
															formatDateShort(p.warrantyStartDate)
														) : (
															<span className="text-zinc-300">—</span>
														)}
													</span>
												</TableCell>
												<TableCell>
													{hasWarranty ? (
														<ConditionBadge sn={p.serialNumber} />
													) : (
														<span className="text-zinc-300 text-xs">—</span>
													)}
												</TableCell>
												<TableCell>
													<div
														className="flex items-center justify-end gap-1"
														onClick={(e) => e.stopPropagation()}>
														{canUpdateWarrantyCondition && hasWarranty && (
															<button
																onClick={() => setConditionTarget(p)}
																className="p-1.5 rounded-md hover:bg-violet-50 text-zinc-400 hover:text-violet-600 transition-colors"
																title="Update kondisi garansi">
																<Wrench size={12} />
															</button>
														)}
														<button
															onClick={() => {
																setSelectedProduct(p);
																setDetailOpen(true);
															}}
															className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
															title="Detail">
															<Eye size={13} />
														</button>
													</div>
												</TableCell>
											</TableRow>
										);
									})
								)}
							</TableBody>
						</Table>
						{/* <Pagination
							page={productPage}
							pageSize={productPageSize}
							total={filtered.length}
							onPageChange={setProductPage}
							onPageSizeChange={(s) => { setProductPageSize(s); setProductPage(1); }}
						/> */}
					</CardContent>
				</Card>
			</div>

			{/* Detail Modal */}
			<Modal
				open={detailOpen}
				onClose={() => setDetailOpen(false)}
				title="Detail Produk"
				size="md">
				{selectedProduct &&
					(() => {
						const cond = conditionsStore[selectedProduct.serialNumber];
						const hasWarranty =
							selectedProduct.status === "warranty_active" ||
							selectedProduct.status === "warranty_expired";
						const days = selectedProduct.warrantyEndDate
							? getDaysRemaining(selectedProduct.warrantyEndDate)
							: 0;
						return (
							<div className="space-y-4">
								<div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
									<div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
										<Package size={16} className="text-zinc-400" />
									</div>
									<div className="flex-1">
										<p className="font-mono text-sm font-semibold text-zinc-900">
											{selectedProduct.serialNumber}
										</p>
										<p className="text-xs text-zinc-500">
											{selectedProduct.productType.name} ·{" "}
											{selectedProduct.productType.category.name}
										</p>
									</div>
									<Badge
										variant={getProductStatusBadgeVariant(
											selectedProduct.status,
										)}
										dot>
										{getProductStatusLabel(selectedProduct.status)}
									</Badge>
								</div>
								<div className="grid grid-cols-2 gap-x-6 gap-y-3">
									{[
										{
											l: "Dealer",
											v: selectedProduct.dealer?.name ?? "—",
										},
										{
											l: "Customer",
											v:
												selectedProduct.deliveryOrder.destinationCustomer
													?.name ?? "—",
										},
										{
											l: "No. HP",
											v:
												selectedProduct.deliveryOrder.destinationCustomer
													?.phone ?? "—",
										},
										{
											l: "Email",
											v:
												selectedProduct.deliveryOrder.destinationCustomer
													?.email ?? "—",
										},
										{
											l: "Mulai Garansi",
											v: selectedProduct.warrantyStartDate
												? formatDateShort(selectedProduct.warrantyStartDate)
												: "—",
										},
										{
											l: "Berakhir Garansi",
											v: selectedProduct.warrantyEndDate
												? `${formatDateShort(selectedProduct.warrantyEndDate)}${days > 0 ? ` (${days} hari)` : " (berakhir)"}`
												: "—",
										},
									].map((item) => (
										<div key={item.l}>
											<p className="text-[11px] text-zinc-400">{item.l}</p>
											<p className="text-xs font-medium text-zinc-800 mt-0.5">
												{item.v}
											</p>
										</div>
									))}
								</div>
								{/* Warranty condition section */}
								{hasWarranty && (
									<div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
										<p className="text-[11px] font-semibold text-zinc-600 mb-2 flex items-center gap-1.5">
											<Wrench size={11} />
											Kondisi Garansi
										</p>
										<div className="flex items-start gap-3">
											{!cond || cond.warrantyCondition === "valid" ? (
												<Badge variant="success" dot>
													Valid
												</Badge>
											) : (
												<Badge variant="danger" dot>
													Rejected
												</Badge>
											)}
											{cond?.warrantyConditionNote && (
												<div className="flex-1">
													<p className="text-[11px] text-zinc-500 italic">
														{'"'}
														{cond.warrantyConditionNote}
														{'"'}
													</p>
													<p className="text-[10px] text-zinc-400 mt-0.5">
														Diupdate {cond.warrantyConditionUpdatedAt} oleh{" "}
														{cond.warrantyConditionUpdatedBy}
													</p>
												</div>
											)}
										</div>
									</div>
								)}
								<div className="flex justify-end gap-2 pt-1">
									{/* {isAdmin && !hasWarranty && (
										<Button
											variant="secondary"
											size="sm"
											onClick={() => {
												setDetailOpen(false);
												setReassignTarget(selectedProduct);
											}}>
											Re-assign Dealer
										</Button>
									)} */}
									{canUpdateWarrantyCondition && hasWarranty && (
										<Button
											variant="secondary"
											size="sm"
											icon={<Wrench size={12} />}
											onClick={() => {
												setDetailOpen(false);
												setConditionTarget(selectedProduct);
											}}>
											Update Kondisi
										</Button>
									)}
									<Button
										variant="outline"
										size="sm"
										onClick={() => setDetailOpen(false)}>
										Tutup
									</Button>
								</div>
							</div>
						);
					})()}
			</Modal>

			{/* <BulkAssignModal
				open={bulkAssignOpen}
				onClose={() => setBulkAssign(false)}
			/> */}

			{/* {isAdmin && (
				<ReassignModal
					product={reassignTarget}
					onClose={() => setReassignTarget(null)}
					onSuccess={(productId, newDealerId, newDealerName) => {
						// In real app: update product list via adapter
						console.log("[reassign]", productId, newDealerId, newDealerName);
						setReassignTarget(null);
					}}
				/>
			)} */}

			<WarrantyModal
				products={warrantyProducts}
				isOpen={warrantyModalOpen}
				onClose={() => {
					setWarrantyModal(false);
					setWarrantyMode(false);
					setWarrantySelected([]);
					setStatusFilter("all");
					setDealerFilter("all");
				}}
			/>
			{warrantyModalOpen && warrantyProducts.length === 0 && null}

			{conditionTarget && (
				<AdminConditionModal
					product={conditionTarget}
					onClose={() => setConditionTarget(null)}
					onSave={(data) => {
						setCondition(conditionTarget.serialNumber, data);
						forceUpdate((n) => n + 1);
						setConditionTarget(null);
					}}
				/>
			)}
		</div>
	);
}
