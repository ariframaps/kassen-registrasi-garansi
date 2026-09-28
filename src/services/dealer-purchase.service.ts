import { HTTP_STATUS } from "@/constants/http-status.constant";
import { db } from "@/db";
import { customer, purchase } from "@/db/schema";
import { HttpError } from "@/lib/api/http-error";
import { eq } from "drizzle-orm";

interface DealerPurchaseFilterParams {
	userId: string;
}

interface PurchaseItemResponse {
	productId: string;
	serialNumber: string;
	productType: string;
	productCategory: string;
	warrantyStartDate: string | null;
	warrantyEndDate: string | null;
	warrantyStatus: string;
	warrantyCondition: string | null;
}

interface DealerPurchaseResponse {
	id: string;
	customerProfile: {
		id: string;
		name: string;
		email: string | null;
		phone: string | null;
		address: string | null;
	};
	purchaseDate: string | null;
	warrantyEndDate: string | null;
	items: PurchaseItemResponse[];
	invoiceFile: string | null;
	totalProducts: number;
}

export const dealerPurchaseService = {
	getDealerPurchases: async (
		params: DealerPurchaseFilterParams,
	): Promise<{
		items: DealerPurchaseResponse[];
		dealerId: string;
	}> => {
		// Get dealer's own customer profile (a dealer is a customer with a linked user)
		const dealer = await db.query.customer.findFirst({
			where: eq(customer.userId, params.userId),
		});

		if (!dealer) {
			throw new HttpError(
				"Dealer tidak ditemukan untuk user ini",
				HTTP_STATUS.NOT_FOUND.code,
			);
		}

		// Get all purchases registered by this dealer (purchase.customerId is always
		// the end customer; the dealer who processed it is tracked via registeredBy)
		const purchases = await db.query.purchase.findMany({
			where: eq(purchase.registeredBy, params.userId),
			with: {
				customer: true,
				items: {
					with: {
						product: {
							with: {
								productType: {
									with: {
										category: true,
									},
								},
								warrantyCondition: true,
							},
						},
					},
				},
				invoice: true,
			},
			orderBy: (p, { desc }) => [desc(p.purchaseDate)],
		});

		const formatDate = (date: string | Date | null): string | null => {
			if (!date) return null;
			if (typeof date === "string") return date;
			return date.toISOString().split("T")[0];
		};

		const data = purchases.map((p) => {
			const warrantyEndDates = p.items
				.map((item) => item.product.warrantyEndDate)
				.filter((date) => date !== null);

			const latestWarrantyEnd =
				warrantyEndDates.length > 0
					? new Date(
							Math.max(
								...warrantyEndDates.map((d) => new Date(d as string).getTime()),
							),
						)
					: null;

			return {
				id: p.id,
				customerProfile: {
					id: p.customer.id,
					name: p.customer.name,
					email: p.customer.email,
					phone: p.customer.phone,
					address: p.customer.address,
				},
				purchaseDate: formatDate(p.purchaseDate),
				warrantyEndDate: formatDate(latestWarrantyEnd),
				items: p.items.map((item) => ({
					productId: item.product.id,
					serialNumber: item.product.serialNumber,
					productType: item.product.productType.name,
					productCategory: item.product.productType.category.name,
					warrantyStartDate: formatDate(item.product.warrantyStartDate),
					warrantyEndDate: formatDate(item.product.warrantyEndDate),
					warrantyStatus:
						item.product.status === "none"
							? "none"
							: item.product.warrantyEndDate && new Date(item.product.warrantyEndDate) < new Date()
								? "expired"
								: "active",
					warrantyCondition:
						item.product.warrantyCondition?.condition || null,
				})),
				invoiceFile: p.invoice ? p.invoice.originalFilename : null,
				totalProducts: p.items.length,
			};
		});

		return {
			items: data,
			dealerId: dealer.id,
		};
	},
};
