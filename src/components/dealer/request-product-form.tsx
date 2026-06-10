"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { dealerApi } from "@/lib/api/api-client";
import { ProductTypeSchema } from "@/db/schema";
import { AlertCircle, Loader2, Check } from "lucide-react";

interface RequestProductFormProps {
	productTypes: ProductTypeSchema[];
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

export function RequestProductForm({
	productTypes,
	isOpen,
	onClose,
	onSuccess,
}: RequestProductFormProps) {
	const [selectedProductType, setSelectedProductType] = useState<string>("");
	const [serialNumber, setSerialNumber] = useState<string>("");
	const [notes, setNotes] = useState<string>("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string>("");
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setSuccess(false);

		if (!selectedProductType) {
			setError("Silakan pilih tipe produk");
			return;
		}

		setIsLoading(true);
		try {
			const response = await dealerApi.requestProduct({
				productTypeId: selectedProductType,
				serialNumberRequested: serialNumber || undefined,
				notes: notes || undefined,
			});

			if (response.success) {
				setSuccess(true);
				setSelectedProductType("");
				setSerialNumber("");
				setNotes("");

				setTimeout(() => {
					setSuccess(false);
					onClose();
					onSuccess?.();
				}, 1500);
			} else {
				setError(response.message || "Gagal membuat request");
			}
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Terjadi kesalahan yang tidak terduga",
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		if (!isLoading) {
			setError("");
			setSuccess(false);
			setSelectedProductType("");
			setSerialNumber("");
			setNotes("");
			onClose();
		}
	};

	return (
		<Modal
			open={isOpen}
			onClose={handleClose}
			title="Request Produk"
			description="Minta produk dari tim sales untuk dealer Anda"
			size="md">

				{success && (
					<div className="flex items-center justify-center py-8">
						<div className="text-center">
							<div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
								<Check size={24} className="text-emerald-600" />
							</div>
							<p className="font-semibold text-zinc-900">Request berhasil dibuat</p>
							<p className="text-sm text-zinc-500 mt-1">
								Tim sales akan memproses request Anda
							</p>
						</div>
					</div>
				)}

				{!success && (
					<form onSubmit={handleSubmit} className="space-y-4">
						{error && (
							<div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
								<AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
								<p className="text-sm text-red-700">{error}</p>
							</div>
						)}

						<div>
							<label className="block text-sm font-medium text-zinc-700 mb-2">
								Tipe Produk *
							</label>
							<Select
								options={productTypes.map((pt) => ({
									value: pt.id,
									label: pt.name,
								}))}
								value={selectedProductType}
								onChange={(e) => setSelectedProductType(e.target.value)}
								placeholder="Pilih tipe produk"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-zinc-700 mb-2">
								Serial Number (Opsional)
							</label>
							<Input
								placeholder="Masukkan serial number spesifik jika ada"
								value={serialNumber}
								onChange={(e) => setSerialNumber(e.target.value)}
								disabled={isLoading}
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-zinc-700 mb-2">
								Catatan (Opsional)
							</label>
							<textarea
								placeholder="Tambahkan catatan atau detail permintaan"
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								disabled={isLoading}
								className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-50 disabled:text-zinc-400"
								rows={3}
							/>
						</div>

						<div className="flex gap-3 pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={handleClose}
								disabled={isLoading}
								className="flex-1">
								Batal
							</Button>
							<Button
								type="submit"
								disabled={isLoading}
								className="flex-1 gap-2">
								{isLoading && <Loader2 size={16} className="animate-spin" />}
								{isLoading ? "Mengirim..." : "Kirim Request"}
							</Button>
						</div>
					</form>
				)}
		</Modal>
	);
}
