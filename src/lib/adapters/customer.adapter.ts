import { customerApi } from "@/lib/api/api-client";
import type { CustomerDetail, PurchaseGroup } from "@/types";

export const customerAdapter = {
	getById: async (id: string): Promise<CustomerDetail | null> => {
		const response = await customerApi.getById(id);
		if (!response.success || !response.data) {
			return null;
		}

		return {
			id: response.data.customer.id,
			customId: response.data.customer.customId,
			name: response.data.customer.name,
			email: response.data.customer.email,
			phone: response.data.customer.phone,
			address: response.data.customer.address || "",
			categoryId: response.data.customer.categoryId,
			categoryName: response.data.customer.categoryName,
			createdAt: response.data.customer.created_at || new Date().toISOString(),
			dealers: response.data.dealers,
			totalPurchases: response.data.totalPurchases,
		};
	},

	getPurchaseHistory: async (id: string): Promise<PurchaseGroup[]> => {
		const response = await customerApi.getById(id);
		if (!response.success || !response.data) {
			return [];
		}
		return response.data.purchases;
	},
};
