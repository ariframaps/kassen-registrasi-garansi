"use client";
import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Search, ChevronDown, Check } from "lucide-react";
import type { UserRole } from "@/types";
import { customerApi } from "@/lib/api/api-client";
import { CustomerSchema } from "@/db/schema";

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
	customerId?: string;
};

// Searchable combobox for picking an existing customer (with no dashboard
// login yet) to link as the new dealer user.
function DealerCustomerCombobox({
	value,
	onChange,
	error,
}: {
	value: CustomerSchema | null;
	onChange: (customer: CustomerSchema | null) => void;
	error?: string;
}) {
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState(false);
	const [options, setOptions] = useState<CustomerSchema[]>([]);
	const [loading, setLoading] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		let active = true;
		const timeout = setTimeout(() => {
			setLoading(true);
			customerApi.getAvailableForDealer({ search: query }).then((res) => {
				if (!active) return;
				if (res.success) setOptions(res.data);
				setLoading(false);
			});
		}, 250);
		return () => {
			active = false;
			clearTimeout(timeout);
		};
	}, [query, open]);

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const displayLabel = value ? `[${value.customId}] - ${value.name}` : query;

	return (
		<div className="w-full" ref={containerRef}>
			<label className="block text-xs font-medium text-zinc-700 mb-1.5">
				Dealer <span className="text-red-500 ml-0.5">*</span>
			</label>
			<div className="relative">
				<Input
					placeholder="Cari nama dealer atau ID..."
					leftIcon={<Search size={13} />}
					rightIcon={<ChevronDown size={13} />}
					value={displayLabel}
					error={error}
					onFocus={() => setOpen(true)}
					onChange={(e) => {
						onChange(null);
						setQuery(e.target.value);
						setOpen(true);
					}}
				/>
				{open && (
					<div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto bg-white border border-zinc-200 rounded-lg shadow-lg">
						{loading ? (
							<div className="px-3 py-2.5 text-xs text-zinc-400">Mencari...</div>
						) : options.length === 0 ? (
							<div className="px-3 py-2.5 text-xs text-zinc-400">
								Tidak ada dealer yang tersedia
							</div>
						) : (
							options.map((c) => (
								<button
									key={c.id}
									type="button"
									onClick={() => {
										onChange(c);
										setQuery("");
										setOpen(false);
									}}
									className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-zinc-50 transition-colors">
									<span className="truncate">
										<span className="font-mono text-zinc-500">
											[{c.customId}]
										</span>{" "}
										<span className="text-zinc-800">{c.name}</span>
									</span>
									{value?.id === c.id && (
										<Check size={12} className="text-blue-600 shrink-0" />
									)}
								</button>
							))
						)}
					</div>
				)}
			</div>
		</div>
	);
}

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
	const [selectedCustomer, setSelectedCustomer] = useState<CustomerSchema | null>(
		null,
	);
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const { success, error: errorToast } = useToast();

	const reset = () => {
		setName("");
		setEmail("");
		setRole("sales");
		setSelectedCustomer(null);
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
		if (role === "dealer" && !selectedCustomer) e.customerId = "Pilih dealer";
		setErrors(e);
		return Object.keys(e).length === 0;
	};

	const handleSave = async () => {
		if (!validate()) return;
		setLoading(true);
		try {
			await onSave({
				name,
				email,
				role,
				...(role === "dealer" && { customerId: selectedCustomer!.id }),
			});
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
					onChange={(e) => {
						setRole(e.target.value as UserRole);
						setSelectedCustomer(null);
					}}
				/>

				{role === "dealer" && (
					<DealerCustomerCombobox
						value={selectedCustomer}
						onChange={setSelectedCustomer}
						error={errors.customerId}
					/>
				)}

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
