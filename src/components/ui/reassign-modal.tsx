"use client";
// components/ui/reassign-modal.tsx
// Admin only: Re-assign produk belum terjual ke dealer lain
import { useState, useEffect } from "react";
import { Modal } from "./modal";
import { Button } from "./button";
import { Select } from "./select";
import { Badge } from "./badge";
// import { productAdapter, dealerAdapter } from "@/lib/adapters";
import type { Product, Dealer } from "@/types";
import { useToast } from "./toast";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { ProductWithNestedSchema } from "@/services/product.service";

interface ReassignModalProps {
	product: ProductWithNestedSchema | null;
	onClose: () => void;
	onSuccess: (
		productId: string,
		newDealerId: string,
		newDealerName: string,
	) => void;
}

export function ReassignModal({
	product,
	onClose,
	onSuccess,
}: ReassignModalProps) {
	const [dealers, setDealers] = useState<Dealer[]>([]);
	const [selectedDealerId, setSelectedDealerId] = useState("");
	const [loading, setLoading] = useState(false);
	const { success, error: toastError } = useToast();

	// useEffect(() => {
	//   if (product) {
	//     dealerAdapter.getAll().then((all) =>
	//       setDealers(all.filter((d) => d.status === "active" && d.id !== product.assignedDealerId))
	//     );
	//     setSelectedDealerId("");
	//   }
	// }, [product]);

	// const canReassign =
	// 	product &&
	// 	(product.status === "assigned_to_dealer" ||
	// 		product.deliveryOrder.uploadedByUser.role === "sales");

	const handleConfirm = async () => {
		if (!product || !selectedDealerId) return;
		setLoading(true);
		try {
			// await productAdapter.reassign({ productId: product.id, newDealerId: selectedDealerId });
			const dealer = dealers.find((d) => d.id === selectedDealerId);
			onSuccess(product.id, selectedDealerId, dealer?.name ?? "");
			success(
				"Produk berhasil di-reassign",
				`SN ${product.serialNumber} → ${dealer?.name}`,
			);
			onClose();
		} catch {
			toastError("Gagal re-assign", "Coba lagi");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			open={!!product}
			onClose={onClose}
			title="Re-assign Produk ke Dealer"
			description="Hanya produk belum terjual yang bisa di-reassign"
			size="md">
			{product && (
				<div className="space-y-4">
					{/* Product info */}
					<div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1.5">
						<p className="text-xs text-zinc-400">Produk</p>
						<p className="text-sm font-mono font-semibold text-zinc-900">
							{product.serialNumber}
						</p>
						<p className="text-xs text-zinc-600">
							{product.productType.name} · {product.productType.category.name}
						</p>
						<div className="flex items-center gap-2 mt-2">
							<Badge variant="neutral">
								{product.dealer?.name ?? "Tidak ada dealer"}
							</Badge>
							<ArrowRight size={12} className="text-zinc-400" />
							{selectedDealerId ? (
								<Badge variant="blue">
									{dealers.find((d) => d.id === selectedDealerId)?.name}
								</Badge>
							) : (
								<span className="text-xs text-zinc-400">
									Pilih dealer tujuan
								</span>
							)}
						</div>
					</div>

					{/* {!canReassign && (
						<div className="flex gap-2 items-start p-3 bg-red-50 border border-red-100 rounded-xl">
							<AlertTriangle
								size={14}
								className="text-red-500 shrink-0 mt-0.5"
							/>
							<p className="text-xs text-red-700">
								Produk ini sudah terjual (ada purchase aktif). Re-assign tidak
								tersedia.
							</p>
						</div>
					)}

					{canReassign && (
						<Select
							label="Dealer Tujuan"
							placeholder="Pilih dealer"
							options={dealers.map((d) => ({ value: d.id, label: d.name }))}
							value={selectedDealerId}
							onChange={(e) => setSelectedDealerId(e.target.value)}
							required
						/>
					)} */}

					{/* <div className="flex justify-end gap-2 pt-1">
						<Button
							variant="outline"
							size="sm"
							onClick={onClose}
							disabled={loading}>
							Batal
						</Button>
						<Button
							size="sm"
							onClick={handleConfirm}
							loading={loading}
							disabled={!canReassign || !selectedDealerId}>
							Re-assign
						</Button>
					</div> */}
				</div>
			)}
		</Modal>
	);
}
