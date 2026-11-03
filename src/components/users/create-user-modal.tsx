"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import type { UserRole } from "@/types";

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

export type CreateUserPayload = {
	name: string;
	email: string;
	role: UserRole;
};

export function CreateUserModal({
	open,
	onClose,
	onSave,
}: {
	open: boolean;
	onClose: () => void;
	onSave: (data: CreateUserPayload) => Promise<void>;
}) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<UserRole>("sales");
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const { success, error: errorToast } = useToast();

	const reset = () => {
		setName("");
		setEmail("");
		setRole("sales");
		setErrors({});
	};

	const handleClose = () => {
		reset();
		onClose();
	};

	const validate = () => {
		const e: Record<string, string> = {};
		if (!name.trim()) e.name = "Wajib diisi";
		if (!email.trim()) e.email = "Wajib diisi";
		else if (!email.includes("@")) e.email = "Format email tidak valid";
		setErrors(e);
		return Object.keys(e).length === 0;
	};

	const handleSave = async () => {
		if (!validate()) return;
		setLoading(true);
		try {
			await onSave({ name, email, role });
			success("User baru berhasil ditambahkan", email);
			handleClose();
		} catch (err) {
			errorToast(err instanceof Error ? err.message : "Gagal menyimpan user");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			open={open}
			onClose={handleClose}
			title="Tambah User Baru"
			size="sm">
			<div className="space-y-3">
				<Input
					label="Nama Lengkap"
					placeholder="Nama user"
					value={name}
					onChange={(e) => setName(e.target.value)}
					error={errors.name}
					required
				/>
				<Input
					label="Email"
					type="email"
					placeholder="email@kassengaransi.id"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					error={errors.email}
					required
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
					value={role}
					onChange={(e) => setRole(e.target.value as UserRole)}
				/>

				{/* Scope description */}
				<div className="px-3 py-2.5 rounded-lg bg-zinc-50 border border-zinc-100 text-[11px] text-zinc-500 leading-relaxed">
					<span className="font-semibold text-zinc-700">
						Scope {ROLE_LABELS[role]}:{" "}
					</span>
					{ROLE_SCOPE[role]}
				</div>

				<div className="flex gap-2 pt-1">
					<Button variant="outline" fullWidth onClick={handleClose}>
						Batal
					</Button>
					<Button fullWidth loading={loading} onClick={handleSave}>
						Tambah User
					</Button>
				</div>
			</div>
		</Modal>
	);
}
