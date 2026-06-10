"use client";
import { useState, useMemo, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConfirmModal, Modal } from "@/components/ui/modal";
import {
	Table,
	TableHead,
	TableHeader,
	TableBody,
	TableRow,
	TableCell,
	EmptyState,
} from "@/components/ui/table";
import { formatDateShort } from "@/lib/utils";
import {
	Search,
	Eye,
	ShoppingBag,
	FileText,
	Package,
	Users,
	Calendar,
	Pencil,
	Plus,
	X,
	User,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import {
	customerApi,
	dealerApi,
	productApi,
	purchaseApi,
} from "@/lib/api/api-client";
import { CustomerSchema } from "@/db/schema";
import {
	PurchaseItemsWithNestedSchema,
	PurchaseWithNestedSchema,
} from "@/services/purchase.service";
import { ProductWithNestedSchema } from "@/services/product.service";

// ── Inline SN Editor ──
function PurchaseItemEditor({
	purchaseId,
	items,
	onItemsSaved,
}: {
	purchaseId: string;
	items: PurchaseItemsWithNestedSchema[];
	onItemsSaved: (updatedItems: PurchaseItemsWithNestedSchema[]) => void;
}) {
	const [allProducts, setAllProducts] = useState<ProductWithNestedSchema[]>([]);
	const [pendingRemovals, setPendingRemovals] = useState<Set<string>>(
		new Set(),
	);
	const [pendingAdditions, setPendingAdditions] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [isLoadingProducts, setIsLoadingProducts] = useState(false);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const { success, error: toastError } = useToast();

	useEffect(() => {
		setIsLoadingProducts(true);
		productApi.getAllWithNested().then((res) => {
			if (res.success) setAllProducts(res.data);
			setIsLoadingProducts(false);
		});
	}, []);

	const currentItemProductIds = items.map((i) => i.productId);

	const activeItems = items.filter((i) => !pendingRemovals.has(i.productId));

	const addedProducts = pendingAdditions
		.map((id) => allProducts.find((p) => p.id === id))
		.filter((p): p is ProductWithNestedSchema => !!p);

	const available = allProducts
		.filter(
			(p) =>
				p.status === "none" &&
				!currentItemProductIds.includes(p.id) &&
				!pendingAdditions.includes(p.id) &&
				(searchQuery === "" ||
					p.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
					p.productType.name
						.toLowerCase()
						.includes(searchQuery.toLowerCase())),
		)
		.slice(0, 6);

	const hasChanges = pendingRemovals.size > 0 || pendingAdditions.length > 0;

	const handleSave = async () => {
		setIsSaving(true);
		try {
			const res = await purchaseApi.updateItems(purchaseId, {
				addedProductIds: pendingAdditions,
				removedProductIds: Array.from(pendingRemovals),
			});
			if (res.success) {
				success(
					"Produk diperbarui",
					`${res.data.length} produk dalam pembelian`,
				);
				onItemsSaved(res.data);
				setPendingRemovals(new Set());
				setPendingAdditions([]);
			} else {
				toastError("Gagal", res.message || "Gagal memperbarui produk");
			}
		} catch {
			toastError("Gagal", "Terjadi kesalahan pada sistem");
		} finally {
			setIsSaving(false);
			setConfirmOpen(false);
		}
	};

	return (
		<div className="space-y-3 p-3 border border-zinc-100 rounded-xl bg-zinc-50/50">
			<div className="flex items-center justify-between">
				<p className="text-xs font-semibold text-zinc-700">
					Kelola Produk dalam Pembelian
				</p>
				{hasChanges && (
					<Button size="xs" onClick={() => setConfirmOpen(true)}>
						Simpan Perubahan Produk
					</Button>
				)}
			</div>

			<div className="space-y-1">
				{activeItems.map((item) => (
					<div
						key={item.productId}
						className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-100 rounded-lg">
						<span className="font-mono text-xs text-zinc-700 flex-1">
							{item.product.serialNumber}
						</span>
						<span className="text-[11px] text-zinc-400">
							{item.product.productType.name}
						</span>
						<button
							onClick={() =>
								setPendingRemovals(
									(prev) => new Set([...prev, item.productId]),
								)
							}
							className="p-1 hover:bg-red-50 text-zinc-300 hover:text-red-500 rounded transition-colors">
							<X size={11} />
						</button>
					</div>
				))}
				{addedProducts.map((p) => (
					<div
						key={p.id}
						className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
						<span className="font-mono text-xs text-blue-700 flex-1">
							{p.serialNumber}
						</span>
						<span className="text-[11px] text-blue-400">
							{p.productType.name}
						</span>
						<span className="text-[10px] text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded font-medium">
							+Baru
						</span>
						<button
							onClick={() =>
								setPendingAdditions((prev) => prev.filter((id) => id !== p.id))
							}
							className="p-1 hover:bg-red-50 text-blue-300 hover:text-red-500 rounded transition-colors">
							<X size={11} />
						</button>
					</div>
				))}
				{activeItems.length === 0 && addedProducts.length === 0 && (
					<p className="text-xs text-zinc-400 text-center py-2">
						Belum ada produk dalam pembelian ini
					</p>
				)}
			</div>

			<div>
				<Input
					placeholder={
						isLoadingProducts
							? "Memuat daftar produk…"
							: "Cari SN atau tipe untuk ditambahkan…"
					}
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					leftIcon={<Search size={12} />}
					disabled={isLoadingProducts}
				/>
				{searchQuery && available.length > 0 && (
					<div className="mt-1 border border-zinc-100 rounded-lg max-h-32 overflow-y-auto divide-y divide-zinc-50">
						{available.map((p) => (
							<button
								key={p.id}
								onClick={() => {
									setPendingAdditions((prev) => [...prev, p.id]);
									setSearchQuery("");
								}}
								className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 text-left transition-colors">
								<Plus size={11} className="text-blue-500 shrink-0" />
								<span className="font-mono text-xs text-zinc-700">
									{p.serialNumber}
								</span>
								<span className="text-[11px] text-zinc-400 flex-1 truncate">
									{p.productType.name}
								</span>
							</button>
						))}
					</div>
				)}
				{searchQuery && available.length === 0 && !isLoadingProducts && (
					<p className="text-[11px] text-zinc-400 mt-1 px-1">
						Tidak ada produk tersedia yang cocok
					</p>
				)}
			</div>

			<ConfirmModal
				open={confirmOpen}
				onClose={() => setConfirmOpen(false)}
				onConfirm={handleSave}
				title="Simpan perubahan produk?"
				description={`${pendingRemovals.size} produk dihapus, ${pendingAdditions.length} produk ditambahkan.`}
				confirmLabel="Simpan"
				loading={isSaving}
			/>
		</div>
	);
}

export default function AdminPurchasesPage() {
	const [purchases, setPurchases] = useState<PurchaseWithNestedSchema[]>([]);
	const [selectedPurchaseItems, setSelectedPurchaseItems] = useState<
		PurchaseItemsWithNestedSchema[] | null
	>(null);

	// Filter state
	const [search, setSearch] = useState("");
	const [dealerFilter, setDealerFilter] = useState("all");
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");

	// Detail modal
	const [selected, setSelected] = useState<PurchaseWithNestedSchema | null>(
		null,
	);

	// Edit purchase modal
	const [editingPurchase, setEditingPurchase] =
		useState<PurchaseWithNestedSchema | null>(null);
	const [editPurchaseForm, setEditPurchaseForm] = useState({
		purchaseDate: "",
		notes: "",
	});
	const [editPurchaseItems, setEditPurchaseItems] = useState<
		PurchaseItemsWithNestedSchema[]
	>([]);
	const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false);

	// Edit customer modal
	const [editingCustomer, setEditingCustomer] =
		useState<CustomerSchema | null>(null);
	const [editCustomerForm, setEditCustomerForm] = useState({
		name: "",
		email: "",
		phone: "",
		address: "",
	});
	const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);

	const { success, error: toastError } = useToast();

	const fetchData = async () => {
		const res = await purchaseApi.getAllWithNested();
		if (res.success) setPurchases(res.data);
	};

	// Load on mount
	useEffect(() => {
		fetchData();
	}, []);

	// Load items when a purchase is selected for detail view
	useEffect(() => {
		let isMounted = true;

		if (selected) {
			purchaseApi
				.getAllPurchaseProductItems({ purchaseId: selected.id })
				.then((res) => {
					if (isMounted && res.success) {
						setSelectedPurchaseItems(res.data);
					}
				})
				.catch((err) => {
					if (isMounted) {
						console.error("Gagal load items:", err);
					}
				});
		} else {
			if (isMounted) {
				setSelectedPurchaseItems(null);
			}
		}

		return () => {
			isMounted = false;
		};
	}, [selected]);

	const filtered = useMemo(() => {
		const q = search.toLowerCase();
		return purchases.filter((g) => {
			const matchSearch =
				q === "" ||
				g.customer.name.toLowerCase().includes(q) ||
				g.customer.email.toLowerCase().includes(q) ||
				(g.dealer?.name ?? "").toLowerCase().includes(q);
			const matchDealer =
				dealerFilter === "all" ||
				(dealerFilter === "none" ? !g.dealerId : g.dealerId === dealerFilter);
			const matchFrom = !dateFrom || g.purchaseDate >= dateFrom;
			const matchTo = !dateTo || g.purchaseDate <= dateTo;
			return matchSearch && matchDealer && matchFrom && matchTo;
		});
	}, [search, dealerFilter, dateFrom, dateTo, purchases]);

	const handleTriggerEdit = (p: PurchaseWithNestedSchema) => {
		setSelected(null);
		setEditingPurchase(p);
		setEditPurchaseForm({
			purchaseDate: p.purchaseDate,
			notes: p.notes ?? "",
		});
		setEditPurchaseItems(selectedPurchaseItems ?? []);
	};

	const handleSavePurchase = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingPurchase) return;
		setIsSubmittingPurchase(true);
		try {
			const res = await purchaseApi.update(editingPurchase.id, {
				purchaseDate: editPurchaseForm.purchaseDate,
				notes: editPurchaseForm.notes || null,
			});
			if (res.success) {
				success("Berhasil", "Data pembelian berhasil diperbarui");
				setEditingPurchase(null);
				fetchData();
			} else {
				toastError("Gagal", res.message || "Gagal memperbarui data pembelian");
			}
		} catch {
			toastError("Gagal", "Terjadi kesalahan pada sistem");
		} finally {
			setIsSubmittingPurchase(false);
		}
	};

	const handleTriggerEditCustomer = () => {
		if (!editingPurchase) return;
		const c = editingPurchase.customer;
		setEditingCustomer(c);
		setEditCustomerForm({
			name: c.name,
			email: c.email,
			phone: c.phone ?? "",
			address: c.address ?? "",
		});
	};

	const handleSaveCustomer = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingCustomer) return;
		setIsSubmittingCustomer(true);
		try {
			const res = await customerApi.update(editingCustomer.id, {
				name: editCustomerForm.name,
				email: editCustomerForm.email,
				phone: editCustomerForm.phone || null,
				address: editCustomerForm.address || null,
			});
			if (res.success) {
				success("Berhasil", "Data customer berhasil diperbarui");
				if (editingPurchase) {
					setEditingPurchase({ ...editingPurchase, customer: res.data });
				}
				setEditingCustomer(null);
			} else {
				toastError("Gagal", res.message || "Gagal memperbarui data customer");
			}
		} catch {
			toastError("Gagal", "Terjadi kesalahan pada sistem");
		} finally {
			setIsSubmittingCustomer(false);
		}
	};

	return (
		<div>
			<Topbar
				title="Daftar Pembelian"
				description="Semua registrasi garansi dikelompokkan per transaksi"
			/>
			<div className="p-6 animate-fade-up">
				{/* Summary cards */}
				<div className="grid grid-cols-3 gap-4 mb-5">
					{[
						{ l: "Total Pembelian", v: purchases.length, c: "text-zinc-900" },
						{
							l: "Via Dealer",
							v: purchases.filter((g) => g.dealerId).length,
							c: "text-blue-700",
						},
						{
							l: "Via Sales Langsung",
							v: purchases.filter((g) => !g.dealerId).length,
							c: "text-violet-700",
						},
					].map((s) => (
						<div
							key={s.l}
							className="bg-white border border-zinc-200 rounded-xl px-4 py-3.5 shadow-sm">
							<p className="text-xs text-zinc-400 mb-1">{s.l}</p>
							<p className={`text-2xl font-semibold font-mono ${s.c}`}>
								{s.v}
							</p>
						</div>
					))}
				</div>

				<Card>
					{/* Filters */}
					<div className="px-5 py-3.5 border-b border-zinc-100 flex flex-wrap gap-2.5 items-center">
						<div className="flex-1 min-w-48 max-w-64">
							<Input
								placeholder="Cari customer atau dealer…"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								leftIcon={<Search size={13} />}
							/>
						</div>
						<Select
							options={[
								{ value: "all", label: "Semua Dealer" },
								{ value: "none", label: "Registrasi Sales" },
								...Array.from(
									new Map(
										purchases
											.filter((d) => d.dealerId)
											.map((d) => [
												d.dealerId,
												{ value: d.dealerId, label: d.dealer?.name ?? "Unknown" },
											]),
									).values(),
								),
							]}
							value={dealerFilter}
							onChange={(e) => setDealerFilter(e.target.value)}
							className="w-48"
						/>
						<div className="flex items-center gap-1.5">
							<Input
								type="date"
								value={dateFrom}
								onChange={(e) => setDateFrom(e.target.value)}
								className="w-36"
							/>
							<span className="text-xs text-zinc-400">—</span>
							<Input
								type="date"
								value={dateTo}
								onChange={(e) => setDateTo(e.target.value)}
								className="w-36"
							/>
						</div>
						<p className="text-xs text-zinc-400 ml-auto">
							{filtered.length} pembelian
						</p>
					</div>

					<CardContent className="p-0">
						<Table>
							<TableHead>
								<TableHeader>ID Pembelian</TableHeader>
								<TableHeader>Customer</TableHeader>
								<TableHeader>Tgl Pembelian</TableHeader>
								<TableHeader>Didaftarkan Oleh</TableHeader>
								<TableHeader className="text-right pr-5">Aksi</TableHeader>
							</TableHead>
							<TableBody>
								{filtered.length === 0 ? (
									<tr>
										<td colSpan={5}>
											<EmptyState
												icon={<ShoppingBag size={18} />}
												title="Tidak ada pembelian"
												description="Ubah filter atau kata kunci"
											/>
										</td>
									</tr>
								) : (
									filtered.map((g) => (
										<TableRow key={g.id}>
											<TableCell>
												<span className="font-mono text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md">
													{g.id.slice(0, 8).toUpperCase()}
												</span>
											</TableCell>
											<TableCell>
												<div>
													<p className="text-xs font-medium text-zinc-900">
														{g.customer.name}
													</p>
													<p className="text-[11px] text-zinc-400">
														{g.customer.email}
													</p>
												</div>
											</TableCell>
											<TableCell>
												<span className="text-xs text-zinc-600">
													{formatDateShort(g.purchaseDate)}
												</span>
											</TableCell>
											<TableCell>
												<span className="text-xs text-zinc-500">
													{g.dealer?.name ??
														g.registeredByUser.name ??
														"—"}
												</span>
											</TableCell>
											<TableCell>
												<div className="flex items-center justify-end">
													<button
														onClick={() => setSelected(g)}
														className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
														title="Detail">
														<Eye size={13} />
													</button>
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>

			{/* ── Detail Modal ── */}
			<Modal
				open={!!selected}
				onClose={() => setSelected(null)}
				title="Detail Pembelian"
				size="lg">
				{selected && (
					<div className="space-y-5">
						{/* Header */}
						<div className="flex items-start gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
							<div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
								<ShoppingBag size={18} className="text-zinc-400" />
							</div>
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-0.5">
									<span className="font-mono text-xs bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded-md">
										{selected.id.slice(0, 8).toUpperCase()}
									</span>
									<span className="text-xs text-zinc-400">·</span>
									<span className="text-xs text-zinc-500">
										{selected.invoice?.createdAt ? formatDateShort(selected.invoice.createdAt) : "—"}
									</span>
								</div>
								<p className="text-sm font-semibold text-zinc-900">
									{selected.customer.name}
								</p>
								<p className="text-xs text-zinc-400">
									{selected.customer.email}
									{selected.customer.phone
										? ` · ${selected.customer.phone}`
										: ""}
								</p>
							</div>
						</div>

						{/* Info grid */}
						<div className="grid grid-cols-3 gap-4">
							<div className="p-3 bg-zinc-50 rounded-xl">
								<div className="flex items-center gap-1.5 mb-1">
									<Calendar size={12} className="text-zinc-400" />
									<p className="text-[11px] text-zinc-400">Tgl Pembelian</p>
								</div>
								<p className="text-xs font-semibold text-zinc-800">
									{formatDateShort(selected.purchaseDate)}
								</p>
							</div>
							<div className="p-3 bg-zinc-50 rounded-xl">
								<div className="flex items-center gap-1.5 mb-1">
									<Package size={12} className="text-zinc-400" />
									<p className="text-[11px] text-zinc-400">Jumlah Produk</p>
								</div>
								<p className="text-xs font-semibold text-zinc-800">
									{selectedPurchaseItems
										? `${selectedPurchaseItems.length} unit`
										: "—"}
								</p>
							</div>
							<div className="p-3 bg-zinc-50 rounded-xl">
								<div className="flex items-center gap-1.5 mb-1">
									<Users size={12} className="text-zinc-400" />
									<p className="text-[11px] text-zinc-400">Didaftarkan</p>
								</div>
								<p className="text-xs font-semibold text-zinc-800">
									{selected.dealer?.name ??
										selected.registeredByUser.name ??
										"—"}
								</p>
							</div>
						</div>

						{/* Notes */}
						{selected.notes && (
							<div className="p-3 border border-zinc-100 rounded-xl">
								<p className="text-[11px] text-zinc-400 mb-1">Catatan</p>
								<p className="text-xs text-zinc-700">{selected.notes}</p>
							</div>
						)}

						{/* Products */}
						{selectedPurchaseItems !== null && (
							<div>
								<p className="text-xs font-semibold text-zinc-700 mb-2">
									Produk dalam pembelian ini
								</p>
								<div className="space-y-1.5 max-h-[75vh] overflow-y-auto">
									{selectedPurchaseItems.map((p) => (
										<div
											key={p.id}
											className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
											<span className="font-mono text-xs bg-white border border-zinc-200 px-2 py-1 rounded-md text-zinc-700 shrink-0">
												{p.product.serialNumber}
											</span>
											<div className="flex-1 min-w-0">
												<p className="text-xs font-medium text-zinc-800">
													{p.product.productType.name}
												</p>
												<p className="text-[11px] text-zinc-400">
													{p.product.productType.category.name}
												</p>
											</div>
											<Badge
												variant={
													p.product.status === "warranty_active"
														? "success"
														: p.product.status === "warranty_expired"
															? "danger"
															: "neutral"
												}
												dot>
												{p.product.status === "warranty_active"
													? "Aktif"
													: p.product.status === "warranty_expired"
														? "Berakhir"
														: "—"}
											</Badge>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Invoice */}
						{selected.invoice ? (
							<div className="flex items-center gap-3 p-3 border border-zinc-100 rounded-xl">
								<div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
									<FileText size={14} className="text-blue-500" />
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-xs font-medium text-zinc-800">
										{selected.invoice.originalFilename}
									</p>
									<p className="text-[11px] text-zinc-400">
										Invoice · {selected.invoice.mimeType}
									</p>
								</div>
								<a
									href={selected.invoice.storagePath}
									target="_blank"
									rel="noopener noreferrer"
									className="shrink-0">
									<Button size="xs" variant="outline">
										Lihat
									</Button>
								</a>
							</div>
						) : (
							<div className="p-3 border border-amber-100 rounded-xl bg-amber-50">
								<p className="text-xs text-amber-700">Tidak ada invoice untuk pembelian ini</p>
							</div>
						)}

						<div className="flex gap-2 pt-1 border-t border-zinc-100">
							<Button
								variant="outline"
								fullWidth
								onClick={() => setSelected(null)}>
								Tutup
							</Button>
							<Button
								variant="secondary"
								fullWidth
								onClick={() => handleTriggerEdit(selected)}>
								<Pencil size={13} className="mr-1.5" />
								Edit Pembelian
							</Button>
						</div>
					</div>
				)}
			</Modal>

			{/* ── Edit Purchase Modal ── */}
			<Modal
				open={!!editingPurchase}
				onClose={() => setEditingPurchase(null)}
				title="Edit Data Pembelian"
				size="lg">
				{editingPurchase && (
					<div className="space-y-5">
						{/* Customer info banner */}
						<div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
							<div className="flex items-center gap-2.5">
								<div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
									<User size={14} className="text-blue-600" />
								</div>
								<div>
									<p className="text-xs font-semibold text-zinc-900">
										{editingPurchase.customer.name}
									</p>
									<p className="text-[11px] text-zinc-400">
										{editingPurchase.customer.email}
									</p>
								</div>
							</div>
							<Button
								size="xs"
								variant="outline"
								onClick={handleTriggerEditCustomer}>
								<Pencil size={11} className="mr-1" />
								Edit Customer
							</Button>
						</div>

						{/* Purchase form */}
						<form onSubmit={handleSavePurchase} className="space-y-4">
							<div className="space-y-1">
								<label className="text-xs font-medium text-zinc-600">
									Tanggal Pembelian <span className="text-red-500">*</span>
								</label>
								<Input
									type="date"
									required
									value={editPurchaseForm.purchaseDate}
									onChange={(e) =>
										setEditPurchaseForm((f) => ({
											...f,
											purchaseDate: e.target.value,
										}))
									}
								/>
							</div>
							<div className="space-y-1">
								<label className="text-xs font-medium text-zinc-600">
									Catatan
								</label>
								<textarea
									className="w-full min-h-[72px] text-xs rounded-lg border border-zinc-200 px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
									placeholder="Catatan tambahan…"
									value={editPurchaseForm.notes}
									onChange={(e) =>
										setEditPurchaseForm((f) => ({
											...f,
											notes: e.target.value,
										}))
									}
								/>
							</div>

							<div className="flex gap-2 pt-2 border-t border-zinc-100">
								<Button
									type="button"
									variant="outline"
									fullWidth
									onClick={() => setEditingPurchase(null)}>
									Batal
								</Button>
								<Button
									type="submit"
									fullWidth
									loading={isSubmittingPurchase}>
									Simpan Data Pembelian
								</Button>
							</div>
						</form>

						{/* SN Editor */}
						<PurchaseItemEditor
							purchaseId={editingPurchase.id}
							items={editPurchaseItems}
							onItemsSaved={(updatedItems) => {
								setEditPurchaseItems(updatedItems);
								setSelectedPurchaseItems(updatedItems);
							}}
						/>
					</div>
				)}
			</Modal>

			{/* ── Edit Customer Modal (sub-modal) ── */}
			<Modal
				open={!!editingCustomer}
				onClose={() => setEditingCustomer(null)}
				title="Edit Data Customer"
				size="md">
				{editingCustomer && (
					<form onSubmit={handleSaveCustomer} className="space-y-4">
						<div className="space-y-1">
							<label className="text-xs font-medium text-zinc-600">
								Nama <span className="text-red-500">*</span>
							</label>
							<Input
								required
								placeholder="Nama customer…"
								value={editCustomerForm.name}
								onChange={(e) =>
									setEditCustomerForm((f) => ({ ...f, name: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-1">
							<label className="text-xs font-medium text-zinc-600">
								Email <span className="text-red-500">*</span>
							</label>
							<Input
								required
								type="email"
								placeholder="email@contoh.com"
								value={editCustomerForm.email}
								onChange={(e) =>
									setEditCustomerForm((f) => ({
										...f,
										email: e.target.value,
									}))
								}
							/>
						</div>
						<div className="space-y-1">
							<label className="text-xs font-medium text-zinc-600">
								No. Telepon
							</label>
							<Input
								type="tel"
								placeholder="0812xxxxxxx"
								value={editCustomerForm.phone}
								onChange={(e) =>
									setEditCustomerForm((f) => ({
										...f,
										phone: e.target.value,
									}))
								}
							/>
						</div>
						<div className="space-y-1">
							<label className="text-xs font-medium text-zinc-600">
								Alamat
							</label>
							<Input
								placeholder="Alamat lengkap…"
								value={editCustomerForm.address}
								onChange={(e) =>
									setEditCustomerForm((f) => ({
										...f,
										address: e.target.value,
									}))
								}
							/>
						</div>
						<div className="flex gap-2 pt-2 border-t border-zinc-100">
							<Button
								type="button"
								variant="outline"
								fullWidth
								onClick={() => setEditingCustomer(null)}>
								Batal
							</Button>
							<Button
								type="submit"
								fullWidth
								loading={isSubmittingCustomer}>
								Simpan Data Customer
							</Button>
						</div>
					</form>
				)}
			</Modal>
		</div>
	);
}
