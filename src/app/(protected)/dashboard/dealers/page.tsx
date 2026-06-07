"use client";
import { useEffect, useState } from "react";
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
import { formatDateShort } from "@/lib/utils";
import {
	Search,
	Eye,
	Plus,
	UserX,
	UserCheck,
	MapPin,
	Mail,
	Phone,
	Package,
	Calendar,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { dealerApi } from "@/lib/api/api-client";
import { DealerSchema } from "@/db/schema";

export default function DealersPage() {
	const [dealers, setDealers] = useState<DealerSchema[]>([]);
	const [search, setSearch] = useState("");
	const [selected, setSelected] = useState<DealerSchema | null>(null);
	const [toggleTarget, setToggle] = useState<DealerSchema | null>(null);

	// State untuk Modal Tambah Dealer
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
	const [newDealer, setNewDealer] = useState({
		name: "",
		email: "",
		phone: "",
		address: "",
	});

	// State untuk Modal Edit Dealer
	const [editingDealer, setEditingDealer] = useState<DealerSchema | null>(null);
	const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

	const { success, error: toastError } = useToast();

	// Fetch data dari API
	const fetchData = async () => {
		const data = await dealerApi.getAll();
		if (data.success) setDealers([...data.data]);
	};

	useEffect(() => {
		fetchData();
	}, []);

	// Filter pencarian
	const filtered = dealers.filter(
		(d) =>
			d.name.toLowerCase().includes(search.toLowerCase()) ||
			d.email.toLowerCase().includes(search.toLowerCase()),
	);

	// Aksi Toggle Status
	const handleToggle = async () => {
		if (!toggleTarget) return;

		try {
			const response = await dealerApi.toggleStatus(toggleTarget.id);
			if (response.success) {
				success(
					response.data.status === "inactive"
						? "Dealer dinonaktifkan"
						: "Dealer diaktifkan",
					toggleTarget.name,
				);
				fetchData();
			} else {
				toastError("Gagal", response.message || "Gagal mengubah status dealer");
			}
		} catch {
			toastError("Gagal", "Terjadi kesalahan pada sistem");
		} finally {
			setToggle(null);
		}
	};

	// Aksi Tambah Dealer Baru
	const handleAddDealer = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newDealer.name || !newDealer.email) {
			toastError("Gagal", "Nama dan Email wajib diisi");
			return;
		}

		setIsSubmittingAdd(true);
		try {
			const response = await dealerApi.add(newDealer);
			if (response.success) {
				success("Berhasil", "Dealer baru berhasil ditambahkan");
				setIsAddModalOpen(false);
				setNewDealer({ name: "", email: "", phone: "", address: "" });
				fetchData();
			} else {
				toastError("Gagal", response.message || "Gagal menambahkan dealer");
			}
		} catch {
			toastError("Gagal", "Terjadi kesalahan pada sistem");
		} finally {
			setIsSubmittingAdd(false);
		}
	};

	// Membuka Modal Edit dari Detail Modal
	const handleTriggerEdit = (dealer: DealerSchema) => {
		setSelected(null); // Tutup modal detail terlebih dahulu
		setEditingDealer(dealer); // Buka modal edit dengan data terisi
	};

	// Aksi Simpan Perubahan Edit Dealer
	const handleEditDealer = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingDealer || !editingDealer.name || !editingDealer.email) {
			toastError("Gagal", "Nama dan Email wajib diisi");
			return;
		}

		setIsSubmittingEdit(true);
		try {
			const response = await dealerApi.update(editingDealer.id, {
				name: editingDealer.name,
				email: editingDealer.email,
				phone: editingDealer.phone,
				address: editingDealer.address,
			});
			if (response.success) {
				success("Berhasil", "Data dealer berhasil diperbarui");
				setEditingDealer(null);
				fetchData();
			} else {
				toastError("Gagal", response.message || "Gagal memperbarui data dealer");
			}
		} catch {
			toastError("Gagal", "Terjadi kesalahan pada sistem");
		} finally {
			setIsSubmittingEdit(false);
		}
	};

	return (
		<div>
			<Topbar title="Dealer" description="Manajemen jaringan dealer" />
			<div className="p-6 animate-fade-up">
				<Card>
					<div className="px-5 py-3.5 border-b border-zinc-100 flex items-center gap-3">
						<div className="flex-1 max-w-64">
							<Input
								placeholder="Cari nama atau email dealer…"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								leftIcon={<Search size={13} />}
							/>
						</div>
						<p className="text-xs text-zinc-400 ml-auto">
							{filtered.length} dealer
						</p>
						<Button
							size="sm"
							icon={<Plus size={13} />}
							onClick={() => setIsAddModalOpen(true)}>
							Tambah Dealer
						</Button>
					</div>
					<CardContent className="p-0">
						<Table>
							<TableHead>
								<TableHeader>Dealer</TableHeader>
								<TableHeader>Kontak</TableHeader>
								<TableHeader>Alamat</TableHeader>
								<TableHeader>Bergabung</TableHeader>
								<TableHeader>Status</TableHeader>
								<TableHeader className="text-right pr-5">Aksi</TableHeader>
							</TableHead>
							<TableBody>
								{filtered.length === 0 ? (
									<tr>
										<td colSpan={6}>
											<EmptyState
												icon={<Package size={18} />}
												title="Tidak ada dealer"
											/>
										</td>
									</tr>
								) : (
									filtered.map((d) => (
										<TableRow key={d.id}>
											<TableCell>
												<div className="flex items-center gap-2.5">
													<div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
														<span className="text-blue-600 text-[11px] font-bold">
															{d.name.charAt(0)}
														</span>
													</div>
													<p className="text-xs font-medium text-zinc-900">
														{d.name}
													</p>
												</div>
											</TableCell>
											<TableCell>
												<p className="text-xs text-zinc-600">{d.email}</p>
												<p className="text-[11px] text-zinc-400 font-mono">
													{d.phone ?? "—"}
												</p>
											</TableCell>
											<TableCell>
												<p className="text-[11px] text-zinc-400 max-w-[200px] truncate">
													{d.address ?? "—"}
												</p>
											</TableCell>
											<TableCell>
												<span className="text-xs text-zinc-400">
													{formatDateShort(d.createdAt)}
												</span>
											</TableCell>
											<TableCell>
												<Badge
													variant={d.status === "active" ? "success" : "danger"}
													dot>
													{d.status === "active" ? "Aktif" : "Nonaktif"}
												</Badge>
											</TableCell>
											<TableCell>
												<div className="flex items-center justify-end gap-1">
													<button
														onClick={() => setSelected(d)}
														className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
														title="Detail">
														<Eye size={13} />
													</button>
													<button
														onClick={() => setToggle(d)}
														className={`p-1.5 rounded-md transition-colors ${d.status === "active" ? "hover:bg-orange-50 text-zinc-400 hover:text-orange-600" : "hover:bg-emerald-50 text-zinc-400 hover:text-emerald-600"}`}
														title={
															d.status === "active" ? "Nonaktifkan" : "Aktifkan"
														}>
														{d.status === "active" ? (
															<UserX size={13} />
														) : (
															<UserCheck size={13} />
														)}
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

			{/* Modal Tambah Dealer */}
			<Modal
				open={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				title="Tambah Dealer Baru"
				size="md">
				<form onSubmit={handleAddDealer} className="space-y-4">
					<div className="space-y-1">
						<label className="text-xs font-medium text-zinc-600">
							Nama Dealer <span className="text-red-500">*</span>
						</label>
						<Input
							required
							placeholder="Masukkan nama dealer..."
							value={newDealer.name}
							onChange={(e) =>
								setNewDealer({ ...newDealer, name: e.target.value })
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
							placeholder="contoh@dealer.com"
							value={newDealer.email}
							onChange={(e) =>
								setNewDealer({ ...newDealer, email: e.target.value })
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
							value={newDealer.phone}
							onChange={(e) =>
								setNewDealer({ ...newDealer, phone: e.target.value })
							}
						/>
					</div>
					<div className="space-y-1">
						<label className="text-xs font-medium text-zinc-600">Alamat</label>
						<Input
							placeholder="Masukkan alamat lengkap..."
							value={newDealer.address}
							onChange={(e) =>
								setNewDealer({ ...newDealer, address: e.target.value })
							}
						/>
					</div>
					<div className="flex gap-2 pt-2 border-t border-zinc-100">
						<Button
							type="button"
							variant="outline"
							fullWidth
							onClick={() => setIsAddModalOpen(false)}>
							Batal
						</Button>
						<Button type="submit" fullWidth loading={isSubmittingAdd}>
							Simpan Dealer
						</Button>
					</div>
				</form>
			</Modal>

			{/* Modal Edit Dealer */}
			<Modal
				open={!!editingDealer}
				onClose={() => setEditingDealer(null)}
				title="Edit Data Dealer"
				size="md">
				{editingDealer && (
					<form onSubmit={handleEditDealer} className="space-y-4">
						<div className="space-y-1">
							<label className="text-xs font-medium text-zinc-600">
								Nama Dealer <span className="text-red-500">*</span>
							</label>
							<Input
								required
								placeholder="Masukkan nama dealer..."
								value={editingDealer.name}
								onChange={(e) =>
									setEditingDealer({ ...editingDealer, name: e.target.value })
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
								placeholder="contoh@dealer.com"
								value={editingDealer.email}
								onChange={(e) =>
									setEditingDealer({ ...editingDealer, email: e.target.value })
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
								value={editingDealer.phone ?? ""}
								onChange={(e) =>
									setEditingDealer({ ...editingDealer, phone: e.target.value })
								}
							/>
						</div>
						<div className="space-y-1">
							<label className="text-xs font-medium text-zinc-600">
								Alamat
							</label>
							<Input
								placeholder="Masukkan alamat lengkap..."
								value={editingDealer.address ?? ""}
								onChange={(e) =>
									setEditingDealer({
										...editingDealer,
										address: e.target.value,
									})
								}
							/>
						</div>
						<div className="flex gap-2 pt-2 border-t border-zinc-100">
							<Button
								type="button"
								variant="outline"
								fullWidth
								onClick={() => setEditingDealer(null)}>
								Batal
							</Button>
							<Button type="submit" fullWidth loading={isSubmittingEdit}>
								Simpan Perubahan
							</Button>
						</div>
					</form>
				)}
			</Modal>

			{/* Detail Modal */}
			<Modal
				open={!!selected}
				onClose={() => setSelected(null)}
				title="Detail Dealer"
				size="lg">
				{selected && (
					<div className="space-y-4">
						<div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
							<div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
								<span className="text-blue-600 text-lg font-bold">
									{selected.name.charAt(0)}
								</span>
							</div>
							<div>
								<p className="text-sm font-semibold text-zinc-900">
									{selected.name}
								</p>
								<Badge
									variant={selected.status === "active" ? "success" : "danger"}
									dot
									className="mt-1">
									{selected.status === "active" ? "Aktif" : "Nonaktif"}
								</Badge>
							</div>
						</div>
						<div className="space-y-3">
							{[
								{
									icon: <Mail size={13} />,
									label: "Email",
									value: selected.email,
								},
								{
									icon: <Phone size={13} />,
									label: "Telepon",
									value: selected.phone ?? "—",
								},
								{
									icon: <MapPin size={13} />,
									label: "Alamat",
									value: selected.address ?? "Belum diisi",
								},
								{
									icon: <Calendar size={13} />,
									label: "Bergabung",
									value: formatDateShort(selected.createdAt),
								},
							].map((item) => (
								<div
									key={item.label}
									className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl">
									<div className="w-7 h-7 rounded-lg bg-white border border-zinc-100 flex items-center justify-center shrink-0 text-zinc-400">
										{item.icon}
									</div>
									<div>
										<p className="text-[11px] text-zinc-400">{item.label}</p>
										<p className="text-xs font-medium text-zinc-800 mt-0.5">
											{item.value}
										</p>
									</div>
								</div>
							))}
						</div>
						<div className="flex gap-2 pt-1">
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
								Edit
							</Button>
							<Button
								variant={selected.status === "active" ? "danger" : "outline"}
								fullWidth
								className="text-nowrap"
								onClick={() => {
									setSelected(null);
									setToggle(selected);
								}}>
								{selected.status === "active" ? "Nonaktifkan" : "Aktifkan"}{" "}
								Dealer
							</Button>
						</div>
					</div>
				)}
			</Modal>

			{/* Confirm Toggle Status Modal */}
			<ConfirmModal
				open={!!toggleTarget}
				onClose={() => setToggle(null)}
				onConfirm={handleToggle}
				title={
					toggleTarget?.status === "active"
						? "Nonaktifkan Dealer?"
						: "Aktifkan Dealer?"
				}
				description={`${toggleTarget?.name} akan ${toggleTarget?.status === "active" ? "tidak bisa mengakses sistem" : "bisa kembali mengakses sistem"}.`}
				confirmLabel={
					toggleTarget?.status === "active" ? "Nonaktifkan" : "Aktifkan"
				}
				variant={toggleTarget?.status === "active" ? "danger" : "primary"}
			/>
		</div>
	);
}
