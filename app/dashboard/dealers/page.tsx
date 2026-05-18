"use client";
import { useState } from "react";
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
import { Pagination } from "@/components/ui/pagination";
import { mockDealers } from "@/mock/mock-data";
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
import type { Dealer } from "@/types";

// todo: belum ada tambah dealer
// todo: getDealers, addDealer, editDealer, editDealerStatus

export default function DealersPage() {
	const [dealers, setDealers] = useState<Dealer[]>(mockDealers);
	const [dealersPage, setDealersPage] = useState(1);
	const [dealersPageSize, setDealersPageSize] = useState(20);
	mockDealers; // fix : fetch real dealers from backend
	const [search, setSearch] = useState("");
	const [selected, setSelected] = useState<Dealer | null>(null);
	const [toggleTarget, setToggle] = useState<Dealer | null>(null);
	const { success } = useToast();

	const filtered = dealers.filter(
		(d) =>
			d.name.toLowerCase().includes(search.toLowerCase()) ||
			d.email.toLowerCase().includes(search.toLowerCase()),
	);

	const handleToggle = () => {
		if (!toggleTarget) return;
		setDealers((prev) =>
			prev.map((d) =>
				d.id === toggleTarget.id
					? { ...d, status: d.status === "active" ? "inactive" : "active" }
					: d,
			),
		);
		success(
			toggleTarget.status === "active"
				? "Dealer dinonaktifkan"
				: "Dealer diaktifkan",
			toggleTarget.name,
		);
		setToggle(null);
	};

	const handleEdit = (dealer: Dealer) => {
		return;
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
						<Button size="sm" icon={<Plus size={13} />}>
							Tambah Dealer
						</Button>
					</div>
					<CardContent className="p-0">
						<Table>
							<TableHead>
								<TableHeader>Dealer</TableHeader>
								<TableHeader>Kontak</TableHeader>
								<TableHeader>Alamat</TableHeader>
								{/* <TableHeader>Total Produk</TableHeader> */}
								<TableHeader>Bergabung</TableHeader>
								<TableHeader>Status</TableHeader>
								<TableHeader className="text-right pr-5">Aksi</TableHeader>
							</TableHead>
							<TableBody>
								{filtered.length === 0 ? (
									<tr>
										<td colSpan={7}>
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
											{/* <TableCell>
												<span className="text-xs font-semibold font-mono text-zinc-700">
													{d}
												</span>
											</TableCell> */}
											<TableCell>
												<span className="text-xs text-zinc-400">
													{formatDateShort(d.created_at)}
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
						<Pagination
							page={dealersPage}
							pageSize={dealersPageSize}
							total={filtered.length}
							onPageChange={setDealersPage}
							onPageSizeChange={(s) => {
								setDealersPageSize(s);
								setDealersPage(1);
							}}
						/>
					</CardContent>
				</Card>
			</div>

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
									value: selected.phone,
								},
								{
									icon: <MapPin size={13} />,
									label: "Alamat",
									value: selected.address ?? "Belum diisi",
								},
								// {
								// 	icon: <Package size={13} />,
								// 	label: "Total Produk",
								// 	value: `${selected.totalProducts} produk`,
								// },
								{
									icon: <Calendar size={13} />,
									label: "Bergabung",
									value: formatDateShort(selected.created_at),
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
								onClick={() => handleEdit(selected)}>
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
