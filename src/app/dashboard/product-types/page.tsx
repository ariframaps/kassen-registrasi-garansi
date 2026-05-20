"use client";
// app/dashboard/product-types/page.tsx
import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/components/ui/toast";
// import { productTypeAdapter } from "@/lib/adapters";
// import type { ProductType, ProductCategory } from "@/lib/adapters";
import { Plus, Pencil, Trash2, Tag, X, Search, Layers } from "lucide-react";

type ProductType = {
	id: string;
	name: string;
	categoryId: string;
	categoryName: string;
	itemCodes: string[];
	createdAt: string;
};

type ProductCategory = {
	id: string;
	name: string;
};

export const mockProductCategories: ProductCategory[] = [
	{ id: "cat1", name: "POS System" },
	{ id: "cat2", name: "Scanner" },
	{ id: "cat3", name: "Bill Counter" },
	{ id: "cat4", name: "Receipt Printer" },
];

export const mockProductTypes: ProductType[] = [
	{
		id: "pt1",
		name: "KDS 2215W",
		categoryId: "cat1",
		categoryName: "POS System",
		itemCodes: ["KDS-2215W", "KDS2215W-A"],
		createdAt: "2024-01-10",
	},
	{
		id: "pt2",
		name: "Queue Kiosk - Luna",
		categoryId: "cat1",
		categoryName: "POS System",
		itemCodes: ["QK-LUNA", "QKLUNA-001"],
		createdAt: "2024-01-12",
	},
	{
		id: "pt3",
		name: "MC 40",
		categoryId: "cat3",
		categoryName: "Bill Counter",
		itemCodes: ["MC-40", "MC40-STD"],
		createdAt: "2024-01-15",
	},
	{
		id: "pt4",
		name: "MC 20",
		categoryId: "cat3",
		categoryName: "Bill Counter",
		itemCodes: ["MC-20"],
		createdAt: "2024-01-15",
	},
	{
		id: "pt5",
		name: "BTP 3050",
		categoryId: "cat4",
		categoryName: "Receipt Printer",
		itemCodes: ["BTP-3050", "BTP3050-USB"],
		createdAt: "2024-01-20",
	},
	{
		id: "pt6",
		name: "GK-420D",
		categoryId: "cat2",
		categoryName: "Scanner",
		itemCodes: ["GK-420D"],
		createdAt: "2024-02-01",
	},
];

// ── Item Code Tag ──
function ItemCodeTag({
	code,
	onRemove,
}: {
	code: string;
	onRemove?: () => void;
}) {
	return (
		<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-xs font-mono border border-zinc-200">
			{code}
			{onRemove && (
				<button
					onClick={onRemove}
					className="text-zinc-400 hover:text-red-500 transition-colors">
					<X size={10} />
				</button>
			)}
		</span>
	);
}

// ── Form Modal ──
function ProductTypeModal({
	open,
	onClose,
	onSave,
	categories,
	initial,
}: {
	open: boolean;
	onClose: () => void;
	onSave: (data: Omit<ProductType, "id" | "createdAt">) => Promise<void>;
	categories: ProductCategory[];
	initial?: ProductType;
}) {
	const [name, setName] = useState(initial?.name ?? "");
	const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
	const [itemCodes, setItemCodes] = useState<string[]>(
		initial?.itemCodes ?? [],
	);
	const [newCode, setNewCode] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);
	const [duplicateError, setDuplicateError] = useState("");

	useEffect(() => {
		if (open) {
			setName(initial?.name ?? "");
			setCategoryId(initial?.categoryId ?? "");
			setItemCodes(initial?.itemCodes ?? []);
			setNewCode("");
			setErrors({});
			setDuplicateError("");
		}
	}, [open, initial]);

	const addCode = async () => {
		const code = newCode.trim().toUpperCase();
		if (!code) return;
		if (itemCodes.includes(code)) {
			setDuplicateError("Item code sudah ada di daftar ini.");
			return;
		}
		// Check globally
		const existing = await productTypeAdapter.findByItemCode(code);
		if (existing && existing.id !== initial?.id) {
			setDuplicateError(
				`Item code '${code}' sudah digunakan oleh tipe "${existing.name}".`,
			);
			return;
		}
		setItemCodes((prev) => [...prev, code]);
		setNewCode("");
		setDuplicateError("");
	};

	const removeCode = (code: string) =>
		setItemCodes((prev) => prev.filter((c) => c !== code));

	const handleSave = async () => {
		const e: Record<string, string> = {};
		if (!name.trim()) e.name = "Nama tipe wajib diisi";
		if (!categoryId) e.categoryId = "Kategori wajib dipilih";
		setErrors(e);
		if (Object.keys(e).length > 0) return;

		const categoryName =
			categories.find((c) => c.id === categoryId)?.name ?? "";
		setLoading(true);
		await onSave({ name: name.trim(), categoryId, categoryName, itemCodes });
		setLoading(false);
		onClose();
	};

	return (
		<Modal
			open={open}
			onClose={onClose}
			title={initial ? "Edit Tipe Produk" : "Tambah Tipe Produk"}
			size="lg">
			<div className="space-y-4">
				<Input
					label="Nama Tipe Produk"
					placeholder="Contoh: HK-300 POS System"
					value={name}
					onChange={(e) => setName(e.target.value)}
					error={errors.name}
					required
				/>
				<Select
					label="Kategori"
					placeholder="Pilih kategori"
					options={categories.map((c) => ({ value: c.id, label: c.name }))}
					value={categoryId}
					onChange={(e) => setCategoryId(e.target.value)}
					error={errors.categoryId}
					required
				/>

				<div>
					<label className="block text-xs font-medium text-zinc-700 mb-1.5">
						Item Code Accurate (mapping)
					</label>
					<div className="flex gap-2 mb-2">
						<Input
							placeholder="Contoh: POS-3453MFH"
							value={newCode}
							onChange={(e) => {
								setNewCode(e.target.value);
								setDuplicateError("");
							}}
							onKeyDown={(e) => e.key === "Enter" && addCode()}
							className="font-mono text-xs"
						/>
						<Button
							variant="outline"
							size="sm"
							onClick={addCode}
							icon={<Plus size={13} />}>
							Tambah
						</Button>
					</div>
					{duplicateError && (
						<p className="text-xs text-red-600 mb-2">{duplicateError}</p>
					)}
					{itemCodes.length > 0 ? (
						<div className="flex flex-wrap gap-1.5">
							{itemCodes.map((code) => (
								<ItemCodeTag
									key={code}
									code={code}
									onRemove={() => removeCode(code)}
								/>
							))}
						</div>
					) : (
						<p className="text-xs text-zinc-400">
							Belum ada item code. Item code boleh dikosongkan.
						</p>
					)}
				</div>

				<div className="flex justify-end gap-2 pt-2">
					<Button
						variant="outline"
						size="sm"
						onClick={onClose}
						disabled={loading}>
						Batal
					</Button>
					<Button size="sm" onClick={handleSave} loading={loading}>
						{initial ? "Simpan Perubahan" : "Tambah Tipe"}
					</Button>
				</div>
			</div>
		</Modal>
	);
}

export default function ProductTypesPage() {
	const [types, setTypes] = useState<ProductType[]>([]);
	const [categories, setCategories] = useState<ProductCategory[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [filterCategory, setFilterCategory] = useState("");

	const [modalOpen, setModalOpen] = useState(false);
	const [editing, setEditing] = useState<ProductType | undefined>();
	const [deleteTarget, setDeleteTarget] = useState<ProductType | undefined>();
	const [deleteLoading, setDeleteLoading] = useState(false);

	const { success, error: toastError } = useToast();

	useEffect(() => {
		// Promise.all([productTypeAdapter.getAll(), productTypeAdapter.getCategories()]).then(
		//   ([t, c]) => {
		//     setTypes(t);
		//     setCategories(c);
		//     setLoading(false);
		//   }
		// );
		setTypes(mockProductTypes);
		setCategories(mockProductCategories);
		setLoading(false);
	}, []);

	const filtered = types.filter((t) => {
		const q = search.toLowerCase();
		const matchSearch =
			!q ||
			t.name.toLowerCase().includes(q) ||
			t.itemCodes.some((c) => c.toLowerCase().includes(q));
		const matchCat = !filterCategory || t.categoryId === filterCategory;
		return matchSearch && matchCat;
	});

	const handleSave = async (data: Omit<ProductType, "id" | "createdAt">) => {
		if (editing) {
			const updated = await productTypeAdapter.update(editing.id, data);
			setTypes((prev) => prev.map((t) => (t.id === editing.id ? updated : t)));
			success("Tipe produk diperbarui", updated.name);
		} else {
			const created = await productTypeAdapter.create(data);
			setTypes((prev) => [...prev, created]);
			success("Tipe produk ditambahkan", created.name);
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setDeleteLoading(true);
		await productTypeAdapter.delete(deleteTarget.id);
		setTypes((prev) => prev.filter((t) => t.id !== deleteTarget.id));
		setDeleteLoading(false);
		setDeleteTarget(undefined);
		success("Tipe produk dihapus");
	};

	return (
		<div className="flex flex-col min-h-screen bg-[var(--bg)]">
			<Topbar title="Kategori & Tipe Produk" />
			<main className="flex-1 p-6 space-y-5 animate-fade-up">
				{/* Stats */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{categories.map((cat) => {
						const count = types.filter((t) => t.categoryId === cat.id).length;
						return (
							<div
								key={cat.id}
								className="bg-white border border-zinc-200 rounded-xl px-4 py-3 shadow-sm">
								<p className="text-xs text-zinc-500 mb-0.5">{cat.name}</p>
								<p className="text-2xl font-bold text-zinc-900">{count}</p>
								<p className="text-xs text-zinc-400">tipe terdaftar</p>
							</div>
						);
					})}
				</div>

				{/* Main table */}
				<Card>
					<CardHeader
						title="Daftar Tipe Produk"
						description="Kelola mapping item code Accurate ke nama tipe produk internal"
						action={
							<Button
								size="sm"
								icon={<Plus size={13} />}
								onClick={() => {
									setEditing(undefined);
									setModalOpen(true);
								}}>
								Tambah Tipe
							</Button>
						}
					/>
					<div className="px-5 py-3 flex gap-2 border-b border-zinc-100">
						<Input
							placeholder="Cari nama tipe atau item code…"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							leftIcon={<Search size={13} />}
							className="max-w-72"
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
								<TableHeader>Nama Tipe</TableHeader>
								<TableHeader>Kategori</TableHeader>
								<TableHeader>Item Code Accurate</TableHeader>
								<TableHeader>Dibuat</TableHeader>
								<TableHeader className="w-20"></TableHeader>
							</TableHead>
							<TableBody>
								{filtered.length === 0 ? (
									<tr>
										<td colSpan={5}>
											<EmptyState
												icon={<Layers size={18} />}
												title="Tidak ada tipe produk"
												description={
													search
														? "Coba ubah kata kunci pencarian"
														: "Tambahkan tipe produk pertama Anda"
												}
											/>
										</td>
									</tr>
								) : (
									filtered.map((type) => (
										<TableRow key={type.id}>
											<TableCell>
												<span className="font-medium text-zinc-900">
													{type.name}
												</span>
											</TableCell>
											<TableCell>
												<Badge variant="blue">{type.categoryName}</Badge>
											</TableCell>
											<TableCell>
												<div className="flex flex-wrap gap-1">
													{type.itemCodes.length === 0 ? (
														<span className="text-xs text-zinc-400 italic">
															Belum ada mapping
														</span>
													) : (
														type.itemCodes.map((code) => (
															<ItemCodeTag key={code} code={code} />
														))
													)}
												</div>
											</TableCell>
											<TableCell className="text-zinc-500 text-xs">
												{type.createdAt}
											</TableCell>
											<TableCell>
												<div className="flex gap-1">
													<button
														onClick={() => {
															setEditing(type);
															setModalOpen(true);
														}}
														className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
														title="Edit">
														<Pencil size={13} />
													</button>
													<button
														onClick={() => setDeleteTarget(type)}
														className="p-1.5 rounded-md hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors"
														title="Hapus">
														<Trash2 size={13} />
													</button>
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					)}
				</Card>

				{/* Info box */}
				<div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
					<div className="flex gap-2.5 items-start">
						<Tag size={15} className="text-blue-600 mt-0.5 shrink-0" />
						<div>
							<p className="text-xs font-medium text-blue-800 mb-1">
								Cara kerja mapping item code
							</p>
							<p className="text-xs text-blue-700 leading-relaxed">
								Saat upload file DO dari Accurate, sistem akan mencocokkan{" "}
								<code className="bg-blue-100 px-1 rounded">item_code</code> di
								file dengan daftar mapping di sini. Jika ditemukan, nama tipe
								yang benar akan otomatis digunakan. Jika tidak ditemukan, sistem
								akan menampilkan peringatan dan Anda bisa menambahkan mapping
								baru langsung dari halaman upload.
							</p>
						</div>
					</div>
				</div>
			</main>

			<ProductTypeModal
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				onSave={handleSave}
				categories={categories}
				initial={editing}
			/>

			<ConfirmModal
				open={!!deleteTarget}
				onClose={() => setDeleteTarget(undefined)}
				onConfirm={handleDelete}
				title="Hapus Tipe Produk"
				description={`Yakin ingin menghapus tipe "${deleteTarget?.name}"? Produk yang sudah menggunakan tipe ini tidak akan terpengaruh.`}
				confirmLabel="Hapus"
				variant="danger"
				loading={deleteLoading}
			/>
		</div>
	);
}
