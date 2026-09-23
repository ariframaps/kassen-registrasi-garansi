"use client";
// app/dashboard/customers/page.tsx
import { useState, useEffect, useMemo, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/components/ui/toast";
import {
	Search,
	Users,
	ChevronRight,
	Plus,
	Pencil,
	Trash2,
	Tag,
	Upload,
	FileSpreadsheet,
	CheckCircle2,
	AlertTriangle,
} from "lucide-react";
import { formatDateShort } from "@/lib/utils";
import { CustomerCategorySchema, CustomerSchema } from "@/db/schema";
import { customerApi, customerCategoryApi } from "@/lib/api/api-client";

type ImportResult = {
	totalRows: number;
	created: number;
	updated: number;
	skipped: number;
	errors: { row: number; message: string }[];
};

// ── Category Form Modal ──
function CategoryModal({
	open,
	onClose,
	onSave,
	initial,
}: {
	open: boolean;
	onClose: () => void;
	onSave: (name: string) => Promise<void>;
	initial?: CustomerCategorySchema;
}) {
	const [name, setName] = useState(initial?.name ?? "");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useLayoutEffect(() => {
		if (!open) return;
		setName(initial?.name ?? "");
		setError("");
	}, [open, initial]);

	const handleSave = async () => {
		if (!name.trim()) {
			setError("Nama kategori wajib diisi");
			return;
		}
		setLoading(true);
		await onSave(name.trim());
		setLoading(false);
		onClose();
	};

	return (
		<Modal
			open={open}
			onClose={onClose}
			title={initial ? "Edit Kategori" : "Tambah Kategori"}
			size="sm">
			<div className="space-y-4">
				<Input
					label="Nama Kategori"
					placeholder="Contoh: Reseller"
					value={name}
					onChange={(e) => {
						setName(e.target.value);
						setError("");
					}}
					error={error}
					required
				/>
				<div className="flex justify-end gap-2 pt-2">
					<Button
						variant="outline"
						size="sm"
						onClick={onClose}
						disabled={loading}>
						Batal
					</Button>
					<Button size="sm" onClick={handleSave} loading={loading}>
						{initial ? "Simpan Perubahan" : "Tambah Kategori"}
					</Button>
				</div>
			</div>
		</Modal>
	);
}

// ── Customer Form Modal ──
function CustomerModal({
	open,
	onClose,
	onSave,
	categories,
	initial,
}: {
	open: boolean;
	onClose: () => void;
	onSave: (data: {
		customId: string;
		name: string;
		categoryId: string | null;
		email: string;
		phone: string;
		address: string;
	}) => Promise<void>;
	categories: CustomerCategorySchema[];
	initial?: CustomerSchema;
}) {
	const [form, setForm] = useState({
		customId: "",
		name: "",
		categoryId: "",
		email: "",
		phone: "",
		address: "",
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useLayoutEffect(() => {
		if (!open) return;
		setForm({
			customId: initial?.customId ?? "",
			name: initial?.name ?? "",
			categoryId: initial?.categoryId ?? "",
			email: initial?.email ?? "",
			phone: initial?.phone ?? "",
			address: initial?.address ?? "",
		});
		setErrors({});
	}, [open, initial]);

	const handleSave = async () => {
		const e: Record<string, string> = {};
		if (!initial && !form.customId.trim()) e.customId = "ID Pelanggan wajib diisi";
		if (!form.name.trim()) e.name = "Nama wajib diisi";
		setErrors(e);
		if (Object.keys(e).length > 0) return;

		setLoading(true);
		await onSave({
			customId: form.customId.trim(),
			name: form.name.trim(),
			categoryId: form.categoryId || null,
			email: form.email.trim(),
			phone: form.phone.trim(),
			address: form.address.trim(),
		});
		setLoading(false);
		onClose();
	};

	return (
		<Modal
			open={open}
			onClose={onClose}
			title={initial ? "Edit Customer" : "Tambah Customer"}
			size="md">
			<div className="space-y-4">
				<Input
					label="ID Pelanggan"
					placeholder="Contoh: CUST-001"
					value={form.customId}
					onChange={(e) => setForm((f) => ({ ...f, customId: e.target.value }))}
					error={errors.customId}
					disabled={!!initial}
					hint={initial ? "ID Pelanggan tidak dapat diubah" : undefined}
					required={!initial}
				/>
				<Input
					label="Nama"
					placeholder="Nama customer…"
					value={form.name}
					onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
					error={errors.name}
					required
				/>
				<Select
					label="Kategori"
					placeholder="Tanpa kategori"
					options={categories.map((c) => ({ value: c.id, label: c.name }))}
					value={form.categoryId}
					onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
				/>
				<Input
					label="Email"
					type="email"
					placeholder="email@contoh.com (opsional)"
					value={form.email}
					onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
				/>
				<Input
					label="No. HP"
					placeholder="08xxxxxxxxxx (opsional)"
					value={form.phone}
					onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
				/>
				<Input
					label="Alamat"
					placeholder="Alamat customer (opsional)"
					value={form.address}
					onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
				/>
				<div className="flex justify-end gap-2 pt-2">
					<Button
						variant="outline"
						size="sm"
						onClick={onClose}
						disabled={loading}>
						Batal
					</Button>
					<Button size="sm" onClick={handleSave} loading={loading}>
						{initial ? "Simpan Perubahan" : "Tambah Customer"}
					</Button>
				</div>
			</div>
		</Modal>
	);
}

// ── Bulk Import Modal ──
function ImportModal({
	open,
	onClose,
	onImported,
}: {
	open: boolean;
	onClose: () => void;
	onImported: () => void;
}) {
	const [file, setFile] = useState<File | null>(null);
	const [dragOver, setDragOver] = useState(false);
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<ImportResult | null>(null);
	const { error: toastError } = useToast();

	useLayoutEffect(() => {
		if (!open) return;
		setFile(null);
		setResult(null);
		setLoading(false);
	}, [open]);

	const handleClose = () => {
		if (loading) return;
		onClose();
	};

	const pickFile = (files: FileList | File[] | null) => {
		if (!files) return;
		const picked = Array.from(files)[0];
		if (!picked) return;
		if (!/\.(xlsx|xls|csv)$/i.test(picked.name)) {
			toastError("Format file tidak didukung", "Gunakan file .xlsx, .xls, atau .csv");
			return;
		}
		setFile(picked);
	};

	const handleImport = async () => {
		if (!file) return;
		setLoading(true);
		const res = await customerApi.import(file);
		setLoading(false);
		if (res.success && res.data) {
			setResult(res.data);
			onImported();
		} else {
			toastError("Gagal mengimpor file", res.message);
		}
	};

	return (
		<Modal
			open={open}
			onClose={handleClose}
			title="Import Customer dari Excel"
			description="Unggah file .xlsx, .xls, atau .csv berisi data customer"
			size="lg">
			{result ? (
				<div className="space-y-4">
					<div className="grid grid-cols-4 gap-3">
						<div className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-center">
							<p className="text-lg font-bold text-zinc-900">{result.totalRows}</p>
							<p className="text-[11px] text-zinc-500">Total Baris</p>
						</div>
						<div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 text-center">
							<p className="text-lg font-bold text-emerald-700">{result.created}</p>
							<p className="text-[11px] text-emerald-600">Dibuat</p>
						</div>
						<div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-center">
							<p className="text-lg font-bold text-blue-700">{result.updated}</p>
							<p className="text-[11px] text-blue-600">Diperbarui</p>
						</div>
						<div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-center">
							<p className="text-lg font-bold text-red-700">{result.skipped}</p>
							<p className="text-[11px] text-red-600">Dilewati</p>
						</div>
					</div>

					{result.errors.length > 0 ? (
						<div>
							<p className="text-xs font-medium text-zinc-700 mb-1.5 flex items-center gap-1.5">
								<AlertTriangle size={13} className="text-amber-500" />
								Baris bermasalah ({result.errors.length})
							</p>
							<div className="max-h-48 overflow-y-auto border border-zinc-200 rounded-lg divide-y divide-zinc-100">
								{result.errors.map((err, i) => (
									<div key={i} className="px-3 py-2 text-xs flex gap-2">
										<span className="text-zinc-400 shrink-0">Baris {err.row}</span>
										<span className="text-zinc-600">{err.message}</span>
									</div>
								))}
							</div>
						</div>
					) : (
						<div className="flex items-center gap-2 text-emerald-600 text-xs">
							<CheckCircle2 size={14} />
							Semua baris berhasil diproses tanpa error.
						</div>
					)}

					<div className="flex justify-end pt-2">
						<Button size="sm" onClick={handleClose}>
							Selesai
						</Button>
					</div>
				</div>
			) : (
				<div className="space-y-4">
					<div
						onDragOver={(e) => {
							e.preventDefault();
							setDragOver(true);
						}}
						onDragLeave={() => setDragOver(false)}
						onDrop={(e) => {
							e.preventDefault();
							setDragOver(false);
							pickFile(e.dataTransfer.files);
						}}
						className={`relative border-2 border-dashed rounded-xl transition-all duration-200 ${
							dragOver
								? "border-blue-400 bg-blue-50"
								: "border-zinc-200 hover:border-zinc-300 bg-zinc-50"
						}`}>
						<div className="py-10 text-center pointer-events-none">
							{file ? (
								<>
									<FileSpreadsheet size={22} className="text-blue-500 mx-auto mb-2" />
									<p className="text-sm text-zinc-700 font-medium">{file.name}</p>
									<p className="text-xs text-zinc-400 mt-1">
										{(file.size / 1024).toFixed(1)} KB
									</p>
								</>
							) : (
								<>
									<Upload size={22} className="text-zinc-300 mx-auto mb-2" />
									<p className="text-sm text-zinc-500">
										Drag & drop atau klik untuk browse
									</p>
									<p className="text-xs text-zinc-400 mt-1">.xlsx, .xls, atau .csv</p>
								</>
							)}
						</div>
						<input
							type="file"
							accept=".xlsx,.xls,.csv"
							onChange={(e) => pickFile(e.target.files)}
							className="absolute inset-0 opacity-0 cursor-pointer"
						/>
					</div>

					<div className="bg-blue-50 border border-blue-100 rounded-lg px-3.5 py-2.5">
						<p className="text-xs text-blue-700 leading-relaxed">
							Kolom yang dikenali: <code className="bg-blue-100 px-1 rounded">ID Pelanggan</code>,{" "}
							<code className="bg-blue-100 px-1 rounded">Nama</code>,{" "}
							<code className="bg-blue-100 px-1 rounded">Kategori</code>,{" "}
							<code className="bg-blue-100 px-1 rounded">Email</code>,{" "}
							<code className="bg-blue-100 px-1 rounded">No HP</code>,{" "}
							<code className="bg-blue-100 px-1 rounded">Alamat</code>. Baris dengan ID
							Pelanggan yang sudah ada akan diperbarui.
						</p>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button variant="outline" size="sm" onClick={handleClose} disabled={loading}>
							Batal
						</Button>
						<Button
							size="sm"
							onClick={handleImport}
							loading={loading}
							disabled={!file}
							icon={<Upload size={13} />}>
							Import
						</Button>
					</div>
				</div>
			)}
		</Modal>
	);
}

export default function CustomersPage() {
	const router = useRouter();
	const [customers, setCustomers] = useState<CustomerSchema[]>([]);
	const [categories, setCategories] = useState<CustomerCategorySchema[]>([]);
	const [search, setSearch] = useState("");
	const [filterCategory, setFilterCategory] = useState("");
	const [loading, setLoading] = useState(true);

	const [customerModalOpen, setCustomerModalOpen] = useState(false);
	const [editingCustomer, setEditingCustomer] = useState<CustomerSchema | undefined>();
	const [deleteTarget, setDeleteTarget] = useState<CustomerSchema | undefined>();
	const [deleteLoading, setDeleteLoading] = useState(false);

	const [categoryModalOpen, setCategoryModalOpen] = useState(false);
	const [editingCategory, setEditingCategory] = useState<CustomerCategorySchema | undefined>();
	const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<
		CustomerCategorySchema | undefined
	>();
	const [deleteCategoryLoading, setDeleteCategoryLoading] = useState(false);

	const [importModalOpen, setImportModalOpen] = useState(false);

	const { success, error: toastError } = useToast();

	const categoryMap = useMemo(
		() => new Map(categories.map((c) => [c.id, c.name])),
		[categories],
	);

	const filtered = useMemo(() => {
		const q = search.toLowerCase();
		return customers.filter((c) => {
			const matchSearch =
				!q ||
				c.name.toLowerCase().includes(q) ||
				c.customId.toLowerCase().includes(q) ||
				(c.email ?? "").toLowerCase().includes(q) ||
				(c.phone ?? "").toLowerCase().includes(q);
			const matchCategory = !filterCategory || c.categoryId === filterCategory;
			return matchSearch && matchCategory;
		});
	}, [search, filterCategory, customers]);

	const loadData = async () => {
		const [customersRes, categoriesRes] = await Promise.all([
			customerApi.getAll(),
			customerCategoryApi.getAll(),
		]);
		if (customersRes.success) setCustomers(customersRes.data);
		if (categoriesRes.success) setCategories(categoriesRes.data);
	};

	useEffect(() => {
		const fetchData = async () => {
			await loadData();
			setLoading(false);
		};
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleSaveCustomer = async (data: {
		customId: string;
		name: string;
		categoryId: string | null;
		email: string;
		phone: string;
		address: string;
	}) => {
		if (editingCustomer) {
			const res = await customerApi.update(editingCustomer.id, {
				name: data.name,
				email: data.email,
				phone: data.phone || null,
				address: data.address || null,
				categoryId: data.categoryId,
			});
			if (res.success && res.data) {
				setCustomers((prev) =>
					prev.map((c) => (c.id === editingCustomer.id ? res.data! : c)),
				);
				success("Customer diperbarui", data.name);
				router.refresh();
			} else {
				toastError("Gagal memperbarui customer", res.message);
			}
		} else {
			const res = await customerApi.add({
				customId: data.customId,
				name: data.name,
				email: data.email || undefined,
				phone: data.phone || undefined,
				address: data.address || undefined,
				categoryId: data.categoryId,
			});
			if (res.success && res.data) {
				setCustomers((prev) => [res.data!, ...prev]);
				success("Customer ditambahkan", data.name);
				router.refresh();
			} else {
				toastError("Gagal menambahkan customer", res.message);
			}
		}
	};

	const handleDeleteCustomer = async () => {
		if (!deleteTarget) return;
		setDeleteLoading(true);
		const res = await customerApi.delete(deleteTarget.id);
		setDeleteLoading(false);

		if (res.success) {
			setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
			setDeleteTarget(undefined);
			success("Customer berhasil dihapus");
			router.refresh();
		} else {
			toastError("Gagal menghapus customer", res.message);
		}
	};

	const handleSaveCategory = async (name: string) => {
		if (editingCategory) {
			const res = await customerCategoryApi.update(editingCategory.id, { name });
			if (res.success && res.data) {
				setCategories((prev) =>
					prev.map((c) => (c.id === editingCategory.id ? res.data! : c)),
				);
				success("Kategori diperbarui", name);
			} else {
				toastError("Gagal memperbarui kategori", res.message);
			}
		} else {
			const res = await customerCategoryApi.add({ name });
			if (res.success && res.data) {
				setCategories((prev) => [...prev, res.data!]);
				success("Kategori ditambahkan", name);
			} else {
				toastError("Gagal menambahkan kategori", res.message);
			}
		}
	};

	const handleDeleteCategory = async () => {
		if (!deleteCategoryTarget) return;
		setDeleteCategoryLoading(true);
		const res = await customerCategoryApi.delete(deleteCategoryTarget.id);
		setDeleteCategoryLoading(false);

		if (res.success) {
			setCategories((prev) => prev.filter((c) => c.id !== deleteCategoryTarget.id));
			setCustomers((prev) =>
				prev.map((c) =>
					c.categoryId === deleteCategoryTarget.id ? { ...c, categoryId: null } : c,
				),
			);
			setDeleteCategoryTarget(undefined);
			success("Kategori berhasil dihapus");
		} else {
			toastError("Gagal menghapus kategori", res.message);
		}
	};

	return (
		<div className="flex flex-col min-h-screen bg-[var(--bg)]">
			<Topbar title="Manajemen Customer" />
			<main className="flex-1 p-6 space-y-5 animate-fade-up">
				{/* Category management */}
				<Card>
					<CardHeader
						title="Kategori Customer"
						description="Kelola kategori yang digunakan untuk mengelompokkan customer"
						action={
							<Button
								size="sm"
								variant="outline"
								icon={<Plus size={13} />}
								onClick={() => {
									setEditingCategory(undefined);
									setCategoryModalOpen(true);
								}}>
								Tambah Kategori
							</Button>
						}
					/>
					{categories.length === 0 ? (
						<CardContent>
							<EmptyState
								icon={<Tag size={18} />}
								title="Belum ada kategori"
								description="Tambahkan kategori customer pertama Anda"
							/>
						</CardContent>
					) : (
						<div className="px-5 py-4 flex flex-wrap gap-2">
							{categories.map((cat) => {
								const count = customers.filter((c) => c.categoryId === cat.id).length;
								return (
									<div
										key={cat.id}
										className="group flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200">
										<span className="text-xs font-medium text-zinc-700">{cat.name}</span>
										<span className="text-[11px] text-zinc-400">({count})</span>
										<button
											onClick={() => {
												setEditingCategory(cat);
												setCategoryModalOpen(true);
											}}
											className="p-1 rounded hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 transition-colors"
											title="Edit">
											<Pencil size={11} />
										</button>
										<button
											onClick={() => setDeleteCategoryTarget(cat)}
											className="p-1 rounded hover:bg-red-100 text-zinc-400 hover:text-red-600 transition-colors"
											title="Hapus">
											<Trash2 size={11} />
										</button>
									</div>
								);
							})}
						</div>
					)}
				</Card>

				{/* Customer list */}
				<Card>
					<CardHeader
						title="Daftar Customer"
						description="Data customer dari semua dealer"
						action={
							<div className="flex gap-2">
								<Button
									size="sm"
									variant="outline"
									icon={<Upload size={13} />}
									onClick={() => setImportModalOpen(true)}>
									Import Excel
								</Button>
								<Button
									size="sm"
									icon={<Plus size={13} />}
									onClick={() => {
										setEditingCustomer(undefined);
										setCustomerModalOpen(true);
									}}>
									Tambah Customer
								</Button>
							</div>
						}
					/>
					<div className="px-5 py-3 flex flex-wrap gap-2 border-b border-zinc-100">
						<Input
							placeholder="Cari ID, nama, email, atau nomor HP…"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							leftIcon={<Search size={13} />}
							className="max-w-80"
						/>
						<Select
							placeholder="Semua Kategori"
							options={categories.map((c) => ({ value: c.id, label: c.name }))}
							value={filterCategory}
							onChange={(e) => setFilterCategory(e.target.value)}
							className="w-44"
						/>
					</div>

					{loading ? (
						<div className="py-14 text-center text-sm text-zinc-400">
							Memuat data…
						</div>
					) : (
						<Table>
							<TableHead>
								<TableHeader>Nama</TableHeader>
								<TableHeader>ID Pelanggan</TableHeader>
								<TableHeader>Kategori</TableHeader>
								<TableHeader>Email</TableHeader>
								<TableHeader>No. HP</TableHeader>
								<TableHeader>Terdaftar</TableHeader>
								<TableHeader className="w-20"></TableHeader>
							</TableHead>
							<TableBody>
								{filtered.length === 0 ? (
									<tr>
										<td colSpan={7}>
											<EmptyState
												icon={<Users size={18} />}
												title="Tidak ada customer"
												description={
													search || filterCategory
														? "Coba ubah kata kunci atau filter kategori"
														: "Belum ada data customer"
												}
											/>
										</td>
									</tr>
								) : (
									filtered.map((c) => (
										<TableRow
											key={c.id}
											onClick={() => router.push(`/dashboard/customers/${c.id}`)}>
											<TableCell>
												<div className="flex items-center gap-2.5">
													<div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
														<span className="text-blue-600 text-xs font-bold uppercase">
															{c.name.charAt(0)}
														</span>
													</div>
													<span className="font-medium text-zinc-900">{c.name}</span>
												</div>
											</TableCell>
											<TableCell className="text-zinc-600 font-mono text-xs">
												{c.customId}
											</TableCell>
											<TableCell>
												{c.categoryId && categoryMap.has(c.categoryId) ? (
													<Badge variant="blue">{categoryMap.get(c.categoryId)}</Badge>
												) : (
													<span className="text-xs text-zinc-400">—</span>
												)}
											</TableCell>
											<TableCell className="text-zinc-600">{c.email ?? "—"}</TableCell>
											<TableCell className="text-zinc-600">{c.phone ?? "—"}</TableCell>
											<TableCell className="text-zinc-500 text-xs">
												{formatDateShort(c.createdAt)}
											</TableCell>
											<TableCell>
												<div
													className="flex items-center gap-1"
													onClick={(e) => e.stopPropagation()}>
													<button
														onClick={() => {
															setEditingCustomer(c);
															setCustomerModalOpen(true);
														}}
														className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
														title="Edit">
														<Pencil size={13} />
													</button>
													<button
														onClick={() => setDeleteTarget(c)}
														className="p-1.5 rounded-md hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors"
														title="Hapus">
														<Trash2 size={13} />
													</button>
													<ChevronRight size={14} className="text-zinc-300" />
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					)}
				</Card>
			</main>

			<CustomerModal
				open={customerModalOpen}
				onClose={() => setCustomerModalOpen(false)}
				onSave={handleSaveCustomer}
				categories={categories}
				initial={editingCustomer}
			/>

			<ConfirmModal
				open={!!deleteTarget}
				onClose={() => setDeleteTarget(undefined)}
				onConfirm={handleDeleteCustomer}
				title="Hapus Customer"
				description={`Yakin ingin menghapus customer "${deleteTarget?.name}"? Customer dengan riwayat pembelian tidak dapat dihapus.`}
				confirmLabel="Hapus"
				variant="danger"
				loading={deleteLoading}
			/>

			<CategoryModal
				open={categoryModalOpen}
				onClose={() => setCategoryModalOpen(false)}
				onSave={handleSaveCategory}
				initial={editingCategory}
			/>

			<ConfirmModal
				open={!!deleteCategoryTarget}
				onClose={() => setDeleteCategoryTarget(undefined)}
				onConfirm={handleDeleteCategory}
				title="Hapus Kategori"
				description={`Yakin ingin menghapus kategori "${deleteCategoryTarget?.name}"? Customer yang menggunakan kategori ini akan menjadi tanpa kategori.`}
				confirmLabel="Hapus"
				variant="danger"
				loading={deleteCategoryLoading}
			/>

			<ImportModal
				open={importModalOpen}
				onClose={() => setImportModalOpen(false)}
				onImported={loadData}
			/>
		</div>
	);
}
