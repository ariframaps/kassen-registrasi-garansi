"use client";
// app/dashboard/products/page.tsx
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
import { mockProducts, mockDealers, PRODUCT_CATEGORIES } from "@/lib/mock-data";
import {
	getProductStatusLabel,
	getProductStatusBadgeVariant,
	formatDateShort,
} from "@/lib/utils";
import {
	Search,
	Eye,
	Shield,
	Package,
	X,
	Check,
	Link2,
	ChevronDown,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth-context";
import type { Product } from "@/types";

// ── Sales Warranty Registration Modal (multi-product, same as dealer flow) ──
function SalesWarrantyModal({
	open,
	products,
	onClose,
}: {
	open: boolean;
	products: Product[];
	onClose: () => void;
}) {
	const [form, setForm] = useState({
		customerName: "",
		phone: "",
		email: "",
		warrantyStart: "",
		invoiceFile: null as File | null,
	});
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
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

	const handleSubmit = async () => {
		if (!validate()) return;
		setLoading(true);
		await new Promise((r) => setTimeout(r, 900));
		setLoading(false);
		onClose();
		success(
			"Garansi berhasil diregistrasikan",
			`${products.length} produk terdaftar`,
		);
	};

	const groupId =
		form.customerName && form.warrantyStart
			? `GRP-${form.customerName.slice(0, 3).toUpperCase()}-${form.warrantyStart.replace(/-/g, "").slice(2)}`
			: null;

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Registrasi Garansi — Sales"
			description={`${products.length} produk dipilih`}
			size="md">
			{/* Selected SNs */}
			<div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl mb-4">
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
					⚠ Semua produk menggunakan 1 data customer & 1 invoice
				</p>
				{groupId && (
					<p className="text-[11px] text-zinc-400 mt-1">
						Grup: <span className="font-mono text-blue-600">{groupId}</span>
					</p>
				)}
			</div>
			<div className="space-y-3">
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
					onChange={(e) => setForm({ ...form, warrantyStart: e.target.value })}
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
									}}
									className="text-zinc-400 hover:text-zinc-600 ml-1">
									<X size={11} />
								</button>
							</div>
						) : (
							<p className="text-xs text-zinc-400">
								Klik untuk upload — PNG, JPG, PDF · Maks 4MB
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
						loading={loading}
						icon={<Shield size={13} />}
						onClick={handleSubmit}>
						Registrasikan Garansi
					</Button>
				</div>
			</div>
		</Modal>
	);
}

// ── Bulk Assign Modal ──
function BulkAssignModal({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const [search, setSearch] = useState("");
	const [selectedSNs, setSelectedSNs] = useState<string[]>([]);
	const [dealerId, setDealerId] = useState("");
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const { success } = useToast();

	const assignable = mockProducts.filter(
		(p) =>
			p.status === "uploaded_by_sales" &&
			(p.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
				p.productType.toLowerCase().includes(search.toLowerCase()) ||
				p.productCategory.toLowerCase().includes(search.toLowerCase())),
	);

	const toggleSN = (sn: string) =>
		setSelectedSNs((prev) =>
			prev.includes(sn) ? prev.filter((s) => s !== sn) : [...prev, sn],
		);

	const selectAll = () => setSelectedSNs(assignable.map((p) => p.serialNumber));

	const handleAssign = async () => {
		setLoading(true);
		await new Promise((r) => setTimeout(r, 800));
		setLoading(false);
		setConfirmOpen(false);
		onClose();
		setSelectedSNs([]);
		setDealerId("");
		setSearch("");
		success(
			`${selectedSNs.length} produk berhasil di-assign`,
			`ke ${mockDealers.find((d) => d.id === dealerId)?.name}`,
		);
	};

	return (
		<>
			<Modal
				open={open}
				onClose={onClose}
				title="Assign Produk ke Dealer"
				description="Pilih produk dan dealer tujuan"
				size="xl">
				<div className="space-y-4">
					{/* Dealer selector */}
					<Select
						label="Dealer Tujuan"
						required
						options={mockDealers
							.filter((d) => d.status === "active")
							.map((d) => ({ value: d.id, label: d.name }))}
						placeholder="Pilih dealer..."
						value={dealerId}
						onChange={(e) => setDealerId(e.target.value)}
					/>

					{/* Search + select all */}
					<div className="flex gap-2 items-center">
						<div className="flex-1">
							<Input
								placeholder="Cari serial number, tipe, atau kategori…"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								leftIcon={<Search size={13} />}
							/>
						</div>
						<button
							onClick={selectAll}
							className="text-xs text-blue-600 hover:underline whitespace-nowrap px-1">
							Pilih Semua ({assignable.length})
						</button>
						{selectedSNs.length > 0 && (
							<button
								onClick={() => setSelectedSNs([])}
								className="text-xs text-zinc-400 hover:text-zinc-600 whitespace-nowrap px-1">
								Batal Semua
							</button>
						)}
					</div>

					{/* Product list */}
					<div className="border border-zinc-100 rounded-xl overflow-hidden">
						<div className="max-h-64 overflow-y-auto divide-y divide-zinc-50">
							{assignable.length === 0 ? (
								<div className="py-8 text-center text-xs text-zinc-400">
									Tidak ada produk yang belum di-assign
								</div>
							) : (
								assignable.map((p) => {
									const sel = selectedSNs.includes(p.serialNumber);
									return (
										<button
											key={p.id}
											onClick={() => toggleSN(p.serialNumber)}
											className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${sel ? "bg-blue-50" : "hover:bg-zinc-50"}`}>
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
											<div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
												<Package size={12} className="text-zinc-400" />
											</div>
											<div className="flex-1 min-w-0">
												<p className="font-mono text-xs font-semibold text-zinc-800">
													{p.serialNumber}
												</p>
												<p className="text-[11px] text-zinc-400 truncate">
													{p.productType} · {p.productCategory}
												</p>
											</div>
										</button>
									);
								})
							)}
						</div>
					</div>

					{/* Selected chips */}
					{selectedSNs.length > 0 && (
						<div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
							<p className="text-xs font-medium text-blue-700 mb-2">
								{selectedSNs.length} produk dipilih
							</p>
							<div className="flex flex-wrap gap-1.5">
								{selectedSNs.map((sn) => (
									<span
										key={sn}
										className="inline-flex items-center gap-1 bg-white border border-blue-200 px-2 py-0.5 rounded-md text-[11px] font-mono text-blue-700">
										{sn}
										<button onClick={() => toggleSN(sn)}>
											<X size={9} />
										</button>
									</span>
								))}
							</div>
						</div>
					)}

					<div className="flex gap-2 pt-1">
						<Button variant="outline" fullWidth onClick={onClose}>
							Batal
						</Button>
						<Button
							fullWidth
							disabled={selectedSNs.length === 0 || !dealerId}
							icon={<Link2 size={13} />}
							onClick={() => setConfirmOpen(true)}>
							Assign {selectedSNs.length > 0 ? `(${selectedSNs.length})` : ""}
						</Button>
					</div>
				</div>
			</Modal>

			<ConfirmModal
				open={confirmOpen}
				onClose={() => setConfirmOpen(false)}
				onConfirm={handleAssign}
				title="Konfirmasi Assign"
				description={`${selectedSNs.length} produk akan di-assign ke ${mockDealers.find((d) => d.id === dealerId)?.name ?? "dealer"}. Tindakan ini tidak bisa dibatalkan.`}
				confirmLabel="Ya, Assign"
				loading={loading}
			/>
		</>
	);
}

// ── Main Page ──
export default function ProductsPage() {
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [dealerFilter, setDealerFilter] = useState("all");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);
	const [bulkAssignOpen, setBulkAssignOpen] = useState(false);

	// For sales warranty: multi-select then open modal
	const [warrantySelectMode, setWarrantySelectMode] = useState(false);
	const [warrantySelected, setWarrantySelected] = useState<string[]>([]);
	const [warrantyModalOpen, setWarrantyModalOpen] = useState(false);

	const { user } = useAuth();
	const canEdit = user?.role === "sales" || user?.role === "superadmin";

	const filtered = useMemo(() => {
		const q = search.toLowerCase();
		return mockProducts.filter((p) => {
			const matchSearch =
				p.serialNumber.toLowerCase().includes(q) ||
				p.productType.toLowerCase().includes(q) ||
				p.productCategory.toLowerCase().includes(q);
			const matchStatus = statusFilter === "all" || p.status === statusFilter;
			const matchDealer =
				dealerFilter === "all" ||
				(dealerFilter === "none"
					? !p.assignedDealerId
					: p.assignedDealerId === dealerFilter);
			const matchCategory =
				categoryFilter === "all" || p.productCategory === categoryFilter;
			return matchSearch && matchStatus && matchDealer && matchCategory;
		});
	}, [search, statusFilter, dealerFilter, categoryFilter]);

	const toggleWarranty = (id: string) =>
		setWarrantySelected((prev) =>
			prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
		);

	const canSalesRegister = (p: Product) =>
		!p.assignedDealerId && p.warrantyStatus === "none";
	const warrantySelectedProducts = mockProducts.filter((p) =>
		warrantySelected.includes(p.id),
	);

	return (
		<div>
			<Topbar title="Produk" description="Kelola semua serial number produk" />
			<div className="p-6 animate-fade-up">
				<Card>
					{/* Filters row */}
					<div className="px-5 py-3.5 border-b border-zinc-100 flex flex-wrap items-center gap-2.5">
						<div className="flex-1 min-w-48 max-w-64">
							<Input
								placeholder="Cari SN, tipe, atau kategori…"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								leftIcon={<Search size={13} />}
							/>
						</div>
						{/* Status */}
						<Select
							options={[
								{ value: "all", label: "Semua Status" },
								{ value: "uploaded_by_sales", label: "Belum Diregistrasikan" },
								{ value: "assigned_to_dealer", label: "Di Dealer" },
								{ value: "warranty_active", label: "Garansi Aktif" },
								{ value: "warranty_expired", label: "Garansi Berakhir" },
							]}
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="w-48"
						/>
						{/* Dealer */}
						<Select
							options={[
								{ value: "all", label: "Semua Dealer" },
								{ value: "none", label: "Tanpa Dealer" },
								...mockDealers.map((d) => ({ value: d.id, label: d.name })),
							]}
							value={dealerFilter}
							onChange={(e) => setDealerFilter(e.target.value)}
							className="w-48"
						/>
						{/* Category */}
						<Select
							options={[
								{ value: "all", label: "Semua Kategori" },
								...PRODUCT_CATEGORIES.map((c) => ({ value: c, label: c })),
							]}
							value={categoryFilter}
							onChange={(e) => setCategoryFilter(e.target.value)}
							className="w-44"
						/>

						<div className="ml-auto flex items-center gap-2">
							<span className="text-xs text-zinc-400">
								{filtered.length} produk
							</span>
							{canEdit && (
								<>
									{warrantySelectMode ? (
										<>
											<Button
												size="sm"
												variant="outline"
												onClick={() => {
													setWarrantySelectMode(false);
													setWarrantySelected([]);
												}}>
												Batal
											</Button>
											<Button
												size="sm"
												disabled={warrantySelected.length === 0}
												icon={<Shield size={13} />}
												onClick={() => setWarrantyModalOpen(true)}>
												Registrasi ({warrantySelected.length})
											</Button>
										</>
									) : (
										<>
											<Button
												size="sm"
												variant="outline"
												icon={<Link2 size={13} />}
												onClick={() => setBulkAssignOpen(true)}>
												Assign ke Dealer
											</Button>
											<Button
												size="sm"
												icon={<Shield size={13} />}
												onClick={() => setWarrantySelectMode(true)}>
												Registrasi Garansi
											</Button>
										</>
									)}
								</>
							)}
						</div>
					</div>

					{warrantySelectMode && (
						<div className="px-5 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
							<Shield size={13} className="text-blue-600" />
							<p className="text-xs text-blue-700">
								Mode registrasi — pilih produk yang{" "}
								<strong>belum di-assign ke dealer</strong> dan belum punya
								garansi aktif
							</p>
						</div>
					)}

					<CardContent className="p-0">
						<Table>
							<TableHead>
								{warrantySelectMode && (
									<TableHeader className="w-10"></TableHeader>
								)}
								<TableHeader>Serial Number</TableHeader>
								<TableHeader>Tipe Produk</TableHeader>
								<TableHeader>Kategori</TableHeader>
								<TableHeader>Status</TableHeader>
								<TableHeader>Dealer</TableHeader>
								<TableHeader>Mulai Garansi</TableHeader>
								<TableHeader>Berakhir</TableHeader>
								<TableHeader className="text-right pr-5">Aksi</TableHeader>
							</TableHead>
							<TableBody>
								{filtered.length === 0 ? (
									<tr>
										<td colSpan={warrantySelectMode ? 9 : 8}>
											<EmptyState
												icon={<Package size={18} />}
												title="Tidak ada produk"
												description="Ubah filter atau kata kunci pencarian"
											/>
										</td>
									</tr>
								) : (
									filtered.map((p) => {
										const selectable =
											warrantySelectMode && canSalesRegister(p);
										const sel = warrantySelected.includes(p.id);
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
																className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${sel ? "bg-blue-600 border-blue-600" : "border-zinc-300"}`}>
																{sel && (
																	<Check
																		size={9}
																		className="text-white"
																		strokeWidth={3}
																	/>
																)}
															</div>
														) : (
															<div
																className="w-4 h-4 rounded border-2 border-zinc-100 bg-zinc-50"
																title="Produk sudah di dealer atau sudah punya garansi"
															/>
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
														{p.productType}
													</span>
												</TableCell>
												<TableCell>
													<span className="text-xs text-zinc-500">
														{p.productCategory}
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
														{p.assignedDealerName ?? (
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
													<span className="text-xs text-zinc-400">
														{p.warrantyEndDate ? (
															formatDateShort(p.warrantyEndDate)
														) : (
															<span className="text-zinc-300">—</span>
														)}
													</span>
												</TableCell>
												<TableCell>
													<div
														className="flex items-center justify-end gap-1"
														onClick={(e) => e.stopPropagation()}>
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
						<div className="px-5 py-3 border-t border-zinc-50 flex items-center justify-between">
							<p className="text-xs text-zinc-400">
								Menampilkan {filtered.length} dari {mockProducts.length} produk
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Detail Modal */}
			<Modal
				open={detailOpen}
				onClose={() => setDetailOpen(false)}
				title="Detail Produk"
				size="md">
				{selectedProduct && (
					<div className="space-y-4">
						<div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
							<div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
								<Package size={16} className="text-zinc-400" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="font-mono text-sm font-semibold text-zinc-900">
									{selectedProduct.serialNumber}
								</p>
								<p className="text-xs text-zinc-500">
									{selectedProduct.productType} ·{" "}
									{selectedProduct.productCategory}
								</p>
							</div>
							<Badge
								variant={getProductStatusBadgeVariant(selectedProduct.status)}
								dot>
								{getProductStatusLabel(selectedProduct.status)}
							</Badge>
						</div>
						<div className="grid grid-cols-2 gap-x-6 gap-y-3">
							{[
								{ l: "Dealer", v: selectedProduct.assignedDealerName ?? "—" },
								{ l: "Customer", v: selectedProduct.customerName ?? "—" },
								{ l: "No. HP", v: selectedProduct.customerPhone ?? "—" },
								{ l: "Email", v: selectedProduct.customerEmail ?? "—" },
								{
									l: "Mulai Garansi",
									v: selectedProduct.warrantyStartDate
										? formatDateShort(selectedProduct.warrantyStartDate)
										: "—",
								},
								{
									l: "Berakhir Garansi",
									v: selectedProduct.warrantyEndDate
										? formatDateShort(selectedProduct.warrantyEndDate)
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
						<div className="flex justify-end pt-1">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setDetailOpen(false)}>
								Tutup
							</Button>
						</div>
					</div>
				)}
			</Modal>

			{/* Bulk Assign */}
			<BulkAssignModal
				open={bulkAssignOpen}
				onClose={() => setBulkAssignOpen(false)}
			/>

			{/* Sales Warranty Registration */}
			<SalesWarrantyModal
				open={warrantyModalOpen}
				products={warrantySelectedProducts}
				onClose={() => {
					setWarrantyModalOpen(false);
					setWarrantySelectMode(false);
					setWarrantySelected([]);
				}}
			/>
		</div>
	);
}
