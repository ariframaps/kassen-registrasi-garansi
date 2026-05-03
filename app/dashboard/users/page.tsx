"use client";
// app/dashboard/users/page.tsx — Admin only: user management
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
import { useToast } from "@/components/ui/toast";
import { mockUsers } from "@/mock/mock-users";
import { formatDateShort } from "@/lib/utils";
import {
	Search,
	Plus,
	Pencil,
	Trash2,
	UserX,
	UserCheck,
	KeyRound,
	RefreshCw,
	UserCog,
	Copy,
	Shield,
	Package,
	Users,
	Wrench,
} from "lucide-react";
import type { User, UserRole } from "@/types";

const ROLE_LABELS: Record<UserRole, string> = {
	admin: "Admin",
	sales: "Sales",
	dealer: "Dealer",
	technical_support: "Technical Support",
};

const ROLE_SCOPE: Record<UserRole, string> = {
	admin:
		"Akses penuh: semua fitur + manajemen user, dealer, produk, pembelian, waiting list, upload Accurate, validasi kondisi garansi",
	sales:
		"Upload produk dari Accurate, assign produk ke dealer, registrasi garansi, kelola pembelian & waiting list. Tidak bisa kelola user.",
	dealer:
		"Registrasi garansi produk yang sudah di-assign, lihat daftar pembelian sendiri, request produk ke waiting list.",
	technical_support:
		"Hanya bisa melihat & mengupdate kondisi garansi (Valid/Rejected) untuk produk yang sudah aktif garansinya.",
};

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
	admin: <Shield size={13} className="text-violet-500" />,
	sales: <Package size={13} className="text-blue-500" />,
	dealer: <Users size={13} className="text-emerald-500" />,
	technical_support: <Wrench size={13} className="text-amber-500" />,
};

const ROLE_BADGE: Record<UserRole, "blue" | "success" | "neutral" | "warning"> =
	{
		admin: "blue",
		sales: "info" as "blue",
		dealer: "success",
		technical_support: "warning",
	};

function generatePassword(): string {
	const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#";
	return Array.from(
		{ length: 12 },
		() => chars[Math.floor(Math.random() * chars.length)],
	).join("");
}

// ── Add / Edit User Modal ──
function UserFormModal({
	open,
	onClose,
	editUser,
}: {
	open: boolean;
	onClose: () => void;
	editUser?: User | null;
}) {
	const [form, setForm] = useState({
		name: editUser?.name ?? "",
		email: editUser?.email ?? "",
		role: (editUser?.role ?? "sales") as UserRole,
	});
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const { success } = useToast();

	const validate = () => {
		const e: Record<string, string> = {};
		if (!form.name.trim()) e.name = "Wajib diisi";
		if (!form.email.trim()) e.email = "Wajib diisi";
		if (!form.email.includes("@")) e.email = "Format email tidak valid";
		setErrors(e);
		return Object.keys(e).length === 0;
	};

	const handleSave = async () => {
		if (!validate()) return;
		setLoading(true);
		await new Promise((r) => setTimeout(r, 700));
		setLoading(false);
		onClose();
		success(
			editUser ? "User berhasil diperbarui" : "User baru berhasil ditambahkan",
			form.email,
		);
	};

	return (
		<Modal
			open={open}
			onClose={onClose}
			title={editUser ? "Edit User" : "Tambah User Baru"}
			size="sm">
			<div className="space-y-3">
				<Input
					label="Nama Lengkap"
					placeholder="Nama user"
					value={form.name}
					onChange={(e) => setForm({ ...form, name: e.target.value })}
					error={errors.name}
					required
				/>
				<Input
					label="Email"
					type="email"
					placeholder="email@kassengaransi.id"
					value={form.email}
					onChange={(e) => setForm({ ...form, email: e.target.value })}
					error={errors.email}
					required
					disabled={!!editUser}
					hint={editUser ? "Email tidak dapat diubah" : undefined}
				/>
				<Select
					label="Role"
					required
					options={[
						{ value: "admin", label: "Admin" },
						{ value: "sales", label: "Sales" },
						{ value: "dealer", label: "Dealer" },
						{ value: "technical_support", label: "Technical Support" },
					]}
					value={form.role}
					onChange={(e) =>
						setForm({ ...form, role: e.target.value as UserRole })
					}
				/>
				{/* Scope description */}
				<div className="px-3 py-2.5 rounded-lg bg-zinc-50 border border-zinc-100 text-[11px] text-zinc-500 leading-relaxed">
					<span className="font-semibold text-zinc-700">
						Scope {ROLE_LABELS[form.role]}:{" "}
					</span>
					{ROLE_SCOPE[form.role]}
				</div>
				{/* {!editUser && (
					<div className="px-3 py-2.5 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-700">
						Password sementara akan di-generate otomatis dan ditampilkan setelah
						user dibuat.
					</div>
				)} */}
				<div className="flex gap-2 pt-1">
					<Button variant="outline" fullWidth onClick={onClose}>
						Batal
					</Button>
					<Button fullWidth loading={loading} onClick={handleSave}>
						{editUser ? "Simpan Perubahan" : "Tambah User"}
					</Button>
				</div>
			</div>
		</Modal>
	);
}

// ── Change / Generate Password Modal ──
function PasswordModal({
	open,
	user,
	onClose,
}: {
	open: boolean;
	user: User | null;
	onClose: () => void;
}) {
	const [mode, setMode] = useState<"manual" | "generate">("generate");
	const [newPw, setNewPw] = useState("");
	const [genPw, setGenPw] = useState(() => generatePassword());
	const [loading, setLoading] = useState(false);
	const [done, setDone] = useState(false);
	const { success } = useToast();

	const finalPw = mode === "generate" ? genPw : newPw;

	const handleSave = async () => {
		if (mode === "manual" && newPw.length < 8) return;
		setLoading(true);
		await new Promise((r) => setTimeout(r, 600));
		setLoading(false);
		setDone(true);
	};

	const handleCopy = () => {
		navigator.clipboard.writeText(finalPw);
		success("Password disalin ke clipboard");
	};

	const handleClose = () => {
		setDone(false);
		setMode("generate");
		setNewPw("");
		setGenPw(generatePassword());
		onClose();
	};

	return (
		<Modal
			open={open}
			onClose={handleClose}
			title="Ubah Password"
			description={user?.email}
			size="sm">
			{done ? (
				<div className="space-y-4">
					<div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
						<p className="text-xs text-emerald-700 mb-2">
							Password berhasil diperbarui
						</p>
						<div className="flex items-center gap-2 justify-center">
							<span className="font-mono text-sm font-semibold text-emerald-800 bg-white border border-emerald-200 px-3 py-1.5 rounded-lg">
								{finalPw}
							</span>
							<button
								onClick={handleCopy}
								className="p-1.5 rounded-md hover:bg-emerald-100 text-emerald-600 transition-colors"
								title="Salin">
								<Copy size={13} />
							</button>
						</div>
						<p className="text-[11px] text-emerald-600 mt-2">
							Sampaikan password ini kepada user dengan aman
						</p>
					</div>
					<Button fullWidth variant="outline" onClick={handleClose}>
						Selesai
					</Button>
				</div>
			) : (
				<div className="space-y-4">
					{/* Mode selector */}
					<div className="grid grid-cols-2 gap-2">
						{(["generate", "manual"] as const).map((m) => (
							<button
								key={m}
								onClick={() => setMode(m)}
								className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
									mode === m
										? "border-blue-400 bg-blue-50 text-blue-700"
										: "border-zinc-200 text-zinc-600 hover:border-zinc-300"
								}`}>
								{m === "generate" ? (
									<RefreshCw size={12} />
								) : (
									<KeyRound size={12} />
								)}
								{m === "generate" ? "Generate otomatis" : "Set manual"}
							</button>
						))}
					</div>

					{mode === "generate" ? (
						<div className="space-y-2">
							<div className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
								<span className="font-mono text-sm flex-1 text-zinc-800">
									{genPw}
								</span>
								<button
									onClick={() => setGenPw(generatePassword())}
									className="p-1.5 rounded-md hover:bg-zinc-200 text-zinc-400 transition-colors"
									title="Generate ulang">
									<RefreshCw size={13} />
								</button>
							</div>
							<p className="text-[11px] text-zinc-400">
								Klik ↺ untuk generate password baru
							</p>
						</div>
					) : (
						<Input
							label="Password Baru"
							type="text"
							placeholder="Minimal 8 karakter"
							value={newPw}
							onChange={(e) => setNewPw(e.target.value)}
							error={
								newPw.length > 0 && newPw.length < 8
									? "Minimal 8 karakter"
									: undefined
							}
						/>
					)}

					<div className="flex gap-2 pt-1">
						<Button variant="outline" fullWidth onClick={handleClose}>
							Batal
						</Button>
						<Button
							fullWidth
							loading={loading}
							disabled={mode === "manual" && newPw.length < 8}
							icon={<KeyRound size={13} />}
							onClick={handleSave}>
							Simpan Password
						</Button>
					</div>
				</div>
			)}
		</Modal>
	);
}

// ── Main Page ──
export default function UsersPage() {
	const [users, setUsers] = useState<User[]>(mockUsers);
	const [search, setSearch] = useState("");
	const [roleFilter, setRoleFilter] = useState("all");
	const [statusFilter, setStatus] = useState("all");
	const [addOpen, setAddOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<User | null>(null);
	const [pwTarget, setPwTarget] = useState<User | null>(null);
	const [toggleTarget, setToggle] = useState<User | null>(null);
	const [deleteTarget, setDelete] = useState<User | null>(null);
	const { success } = useToast();

	const filtered = useMemo(() => {
		const q = search.toLowerCase();
		return users.filter((u) => {
			const matchSearch =
				u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
			const matchRole = roleFilter === "all" || u.role === roleFilter;
			const matchStatus = statusFilter === "all" || u.status === statusFilter;
			return matchSearch && matchRole && matchStatus;
		});
	}, [users, search, roleFilter, statusFilter]);

	const handleToggleStatus = () => {
		if (!toggleTarget) return;
		setUsers((prev) =>
			prev.map((u) =>
				u.id === toggleTarget.id
					? { ...u, status: u.status === "active" ? "inactive" : "active" }
					: u,
			),
		);
		success(
			toggleTarget.status === "active"
				? "User dinonaktifkan"
				: "User diaktifkan",
			toggleTarget.email,
		);
		setToggle(null);
	};

	const handleDelete = () => {
		if (!deleteTarget) return;
		setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
		success("User dihapus", deleteTarget.email);
		setDelete(null);
	};

	// Summary counts
	const counts = {
		total: users.length,
		active: users.filter((u) => u.status === "active").length,
		inactive: users.filter((u) => u.status === "inactive").length,
	};

	return (
		<div>
			<Topbar
				title="Manajemen User"
				description="Kelola akun pengguna sistem"
			/>
			<div className="p-6 animate-fade-up space-y-5">
				{/* Summary */}
				<div className="grid grid-cols-4 gap-4">
					{[
						{ l: "Total User", v: counts.total, c: "text-zinc-900" },
						{ l: "Aktif", v: counts.active, c: "text-emerald-600" },
						{ l: "Nonaktif", v: counts.inactive, c: "text-red-600" },
						{ l: "Role Terdaftar", v: 4, c: "text-blue-600" },
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
					{/* Filters */}
					<div className="px-5 py-3.5 border-b border-zinc-100 flex flex-wrap gap-2.5 items-center">
						<div className="flex-1 min-w-48 max-w-64">
							<Input
								placeholder="Cari nama atau email…"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								leftIcon={<Search size={13} />}
							/>
						</div>
						<Select
							options={[
								{ value: "all", label: "Semua Role" },
								{ value: "admin", label: "Admin" },
								{ value: "sales", label: "Sales" },
								{ value: "dealer", label: "Dealer" },
								{ value: "technical_support", label: "Technical Support" },
							]}
							value={roleFilter}
							onChange={(e) => setRoleFilter(e.target.value)}
							className="w-48"
						/>
						<Select
							options={[
								{ value: "all", label: "Semua Status" },
								{ value: "active", label: "Aktif" },
								{ value: "inactive", label: "Nonaktif" },
							]}
							value={statusFilter}
							onChange={(e) => setStatus(e.target.value)}
							className="w-36"
						/>
						<Button
							size="sm"
							icon={<Plus size={13} />}
							className="ml-auto"
							onClick={() => setAddOpen(true)}>
							Tambah User
						</Button>
					</div>

					<CardContent className="p-0">
						<Table>
							<TableHead>
								<TableHeader>User</TableHeader>
								<TableHeader>Role</TableHeader>
								<TableHeader>Status</TableHeader>
								<TableHeader>Bergabung</TableHeader>
								<TableHeader>Login Terakhir</TableHeader>
								<TableHeader className="text-right pr-5">Aksi</TableHeader>
							</TableHead>
							<TableBody>
								{filtered.length === 0 ? (
									<tr>
										<td colSpan={6}>
											<EmptyState
												icon={<UserCog size={18} />}
												title="Tidak ada user"
												description="Ubah filter atau tambah user baru"
											/>
										</td>
									</tr>
								) : (
									filtered.map((u) => (
										<TableRow key={u.id}>
											<TableCell>
												<div className="flex items-center gap-2.5">
													<div
														className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${
															u.status === "inactive"
																? "bg-zinc-100 text-zinc-400"
																: "bg-blue-100 text-blue-600"
														}`}>
														{u.name.charAt(0).toUpperCase()}
													</div>
													<div>
														<p
															className={`text-xs font-medium ${u.status === "inactive" ? "text-zinc-400" : "text-zinc-900"}`}>
															{u.name}
														</p>
														<p className="text-[11px] text-zinc-400">
															{u.email}
														</p>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-start gap-1.5">
													{ROLE_ICONS[u.role]}
													<div>
														<span className="text-xs text-zinc-700 font-medium">
															{ROLE_LABELS[u.role]}
														</span>
														{/* <p className="text-[10px] text-zinc-400 mt-0.5 max-w-[220px] leading-relaxed">{ROLE_SCOPE[u.role]}</p> */}
													</div>
												</div>
											</TableCell>
											<TableCell>
												<Badge
													variant={u.status === "active" ? "success" : "danger"}
													dot>
													{u.status === "active" ? "Aktif" : "Nonaktif"}
												</Badge>
											</TableCell>
											<TableCell>
												<span className="text-xs text-zinc-400">
													{formatDateShort(u.createdAt)}
												</span>
											</TableCell>
											<TableCell>
												<span className="text-xs text-zinc-400">
													{u.lastLogin ? formatDateShort(u.lastLogin) : "—"}
												</span>
											</TableCell>
											<TableCell>
												<div className="flex items-center justify-end gap-1">
													{/* Edit */}
													<button
														onClick={() => setEditTarget(u)}
														className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
														title="Edit user">
														<Pencil size={12} />
													</button>
													{/* Password */}
													{/* <button
														onClick={() => setPwTarget(u)}
														className="p-1.5 rounded-md hover:bg-amber-50 text-zinc-400 hover:text-amber-600 transition-colors"
														title="Ubah password">
														<KeyRound size={12} />
													</button> */}
													{/* Activate / Deactivate */}
													<button
														onClick={() => setToggle(u)}
														className={`p-1.5 rounded-md transition-colors ${
															u.status === "active"
																? "hover:bg-orange-50 text-zinc-400 hover:text-orange-600"
																: "hover:bg-emerald-50 text-zinc-400 hover:text-emerald-600"
														}`}
														title={
															u.status === "active" ? "Nonaktifkan" : "Aktifkan"
														}>
														{u.status === "active" ? (
															<UserX size={12} />
														) : (
															<UserCheck size={12} />
														)}
													</button>
													{/* Delete */}
													<button
														onClick={() => setDelete(u)}
														className="p-1.5 rounded-md hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors"
														title="Hapus user">
														<Trash2 size={12} />
													</button>
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
						<div className="px-5 py-3 border-t border-zinc-50">
							<p className="text-xs text-zinc-400">
								{filtered.length} dari {users.length} user
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Modals */}
			<UserFormModal open={addOpen} onClose={() => setAddOpen(false)} />
			<UserFormModal
				open={!!editTarget}
				onClose={() => setEditTarget(null)}
				editUser={editTarget}
			/>
			<PasswordModal
				open={!!pwTarget}
				user={pwTarget}
				onClose={() => setPwTarget(null)}
			/>

			<ConfirmModal
				open={!!toggleTarget}
				onClose={() => setToggle(null)}
				onConfirm={handleToggleStatus}
				title={
					toggleTarget?.status === "active"
						? "Nonaktifkan User?"
						: "Aktifkan User?"
				}
				description={
					toggleTarget?.status === "active"
						? `${toggleTarget?.name} tidak akan bisa login ke sistem.`
						: `${toggleTarget?.name} akan bisa kembali login ke sistem.`
				}
				confirmLabel={
					toggleTarget?.status === "active" ? "Nonaktifkan" : "Aktifkan"
				}
				variant={toggleTarget?.status === "active" ? "danger" : "primary"}
			/>

			<ConfirmModal
				open={!!deleteTarget}
				onClose={() => setDelete(null)}
				onConfirm={handleDelete}
				title="Hapus User Permanen?"
				description={`Akun ${deleteTarget?.name} (${deleteTarget?.email}) akan dihapus permanen dan tidak bisa dipulihkan.`}
				confirmLabel="Hapus Permanen"
				variant="danger"
			/>
		</div>
	);
}
