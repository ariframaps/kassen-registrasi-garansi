import { customerApi } from "@/lib/api/api-client";
import type { CustomerDetail, PurchaseGroup } from "@/types";

export const customerAdapter = {
	getById: async (id: string): Promise<CustomerDetail> => {
		const response = await customerApi.getById(id);
		if (!response.success || !response.data) {
			throw new Error(response.error || "Failed to fetch customer detail");
		}
		return {
			id: response.data.customer.id,
			name: response.data.customer.name,
			email: response.data.customer.email,
			phone: response.data.customer.phone || "",
			address: response.data.customer.address || "",
			created_at: response.data.customer.created_at,
			updated_at: response.data.customer.updated_at,
			createdAt: response.data.customer.created_at,
			dealers: response.data.dealers,
			totalPurchases: response.data.totalPurchases,
		};
	},

	getPurchaseHistory: async (id: string): Promise<PurchaseGroup[]> => {
		const response = await customerApi.getById(id);
		if (!response.success || !response.data) {
			throw new Error(response.error || "Failed to fetch purchase history");
		}
		return response.data.purchases;
	},
};
