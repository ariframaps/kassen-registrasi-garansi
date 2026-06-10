import { SendOtpResponseData } from "@/app/api/v1/auth/_send-otp/route";
import { ApiResponse } from "./api-response";
import { authClient } from "../auth-client";
import {
	CategorySchema,
	CustomerSchema,
	DealerSchema,
	ItemCodeInsertSchema,
	ItemCodeMapsSchema,
	ProductSchema,
	ProductTypeInsertSchema,
	ProductTypeSchema,
	UserSchema,
	WaitingListSchema,
} from "@/db/schema";
import { ProductWithNestedSchema } from "@/services/product.service";
import {
	PurchaseItemsWithNestedSchema,
	PurchaseWithNestedSchema,
} from "@/services/purchase.service";
import { ProductTypeWithNestedSchema } from "@/services/product-type.service";
import type { PurchaseGroup } from "@/types";

async function apiFetch<T>(
	input: RequestInfo,
	init?: RequestInit,
): Promise<ApiResponse<T>> {
	const isFormData = init?.body instanceof FormData;
	const headers = isFormData
		? { ...(init?.headers || {}) } // Don't set Content-Type for FormData
		: {
				"Content-Type": "application/json",
				...(init?.headers || {}),
			};

	const response = await fetch("/api/v1" + input, {
		headers,
		...init,
	});
	const data = await response.json();
	return data;
}

export const authApi = {
	sendOtp: async ({ email }: { email: string }) => {
		const { error } = await authClient.emailOtp.sendVerificationOtp({
			email,
			type: "sign-in",
		});
		if (error) throw new Error(error.statusText);
	},
	verifyOtp: async ({ email, otp }: { email: string; otp: string }) => {
		const { error } = await authClient.signIn.emailOtp({
			email,
			otp,
		});
		if (error) throw new Error(error.statusText);
	},
};

export const productApi = {
	getAllWithNested: async () => {
		return apiFetch<ProductWithNestedSchema[]>("/products", {
			method: "GET",
		});
	},

	findOneBySN: async ({ sn }: { sn: string }) => {
		return apiFetch<ProductSchema | undefined>(`/products/${sn}`, {
			method: "GET",
		});
	},

	updateWarrantyStatus: async ({
		productId,
		condition,
		reason,
	}: {
		productId: string;
		condition: "valid" | "rejected";
		reason?: string;
	}) => {
		return apiFetch(`/products/${productId}/warranty-status`, {
			method: "PATCH",
			body: JSON.stringify({ condition, reason: reason || "" }),
		});
	},
};

// export const productTypeApi = {
// 	getAllWithNested: async () => {
// 		return apiFetch<ProductTypeWithNestedSchema[]>("/product-types", {
// 			method: "GET",
// 		});
// 	},

// 	getItemCodes: async ({ typeId }: { typeId: string }) => {
// 		return apiFetch<ItemCodeMapsSchema[]>(`/product-types/${typeId}/codes`, {
// 			method: "GET",
// 		});
// 	},

// 	editCodes: async ({
// 		typeId,
// 		data,
// 	}: {
// 		typeId: string;
// 		data: {
// 			deleted: string[];
// 			added: string[];
// 		};
// 	}) => {
// 		return apiFetch<ItemCodeMapsSchema[]>(`/product-types/${typeId}/codes`, {
// 			method: "PATCH",
// 			body: JSON.stringify({ typeId, data }),
// 		});
// 	},

// 	addNew: async (data: ProductTypeInsertSchema) => {
// 		return apiFetch<ProductTypeWithNestedSchema>(`/product-types`, {
// 			method: "POST",
// 			body: JSON.stringify(data),
// 		});
// 	},
// };

export const productTypeApi = {
	getAllWithNested: async () => {
		return apiFetch<ProductTypeWithNestedSchema[]>("/product-types", {
			method: "GET",
		});
	},

	// Perubahan 1: Mengirimkan payload gabungan saat membuat Product Type baru
	addNew: async (data: {
		name: string;
		categoryId: string;
		itemCodes: string[];
	}) => {
		return apiFetch<ProductTypeWithNestedSchema>(`/product-types`, {
			method: "POST",
			body: JSON.stringify(data),
		});
	},

	// Perubahan 2: Menggunakan PUT untuk mengupdate nama, kategori, dan sync item codes sekaligus
	update: async ({
		typeId,
		name,
		categoryId,
		data,
	}: {
		typeId: string;
		name: string;
		categoryId: string;
		data: {
			deleted: string[];
			added: string[];
		};
	}) => {
		return apiFetch<ProductTypeWithNestedSchema>(`/product-types/${typeId}`, {
			method: "PUT",
			body: JSON.stringify({ name, categoryId, data }),
		});
	},

	// Perubahan 3: Tambahkan fungsi delete
	delete: async (typeId: string) => {
		return apiFetch<{ message: string }>(`/product-types/${typeId}`, {
			method: "DELETE",
		});
	},
};

export const itemCodeMappingApi = {
	getAllItemCodes: async () => {
		return apiFetch<ItemCodeMapsSchema[]>("/item-codes", {
			method: "GET",
		});
	},
	findItemCode: async ({ code }: { code: string }) => {
		return apiFetch<ItemCodeMapsSchema | undefined>(`/item-codes/${code}`, {
			method: "GET",
		});
	},
	addNew: async (data: ItemCodeInsertSchema[]) => {
		return apiFetch<ItemCodeMapsSchema[]>(`/item-codes`, {
			method: "POST",
			body: JSON.stringify(data),
		});
	},
};

export const productCateogoryApi = {
	getAll: async () => {
		return apiFetch<CategorySchema[]>("/product-categories", {
			method: "GET",
		});
	},
};

export const purchaseApi = {
	getAllWithNested: async () => {
		return apiFetch<PurchaseWithNestedSchema[]>("/purchases", {
			method: "GET",
		});
	},

	getAllPurchaseProductItems: async ({
		purchaseId,
	}: {
		purchaseId: string;
	}) => {
		return apiFetch<PurchaseItemsWithNestedSchema[]>(
			`/purchases/${purchaseId}/items`,
			{ method: "GET" },
		);
	},

	update: async (
		id: string,
		data: { purchaseDate: string; notes?: string | null },
	) => {
		return apiFetch<PurchaseWithNestedSchema>(`/purchases/${id}`, {
			method: "PUT",
			body: JSON.stringify(data),
		});
	},

	updateItems: async (
		purchaseId: string,
		data: { addedProductIds: string[]; removedProductIds: string[] },
	) => {
		return apiFetch<PurchaseItemsWithNestedSchema[]>(
			`/purchases/${purchaseId}/items`,
			{ method: "PATCH", body: JSON.stringify(data) },
		);
	},
};

export const dealerApi = {
	getAll: async () => {
		return apiFetch<DealerSchema[]>("/dealers", { method: "GET" });
	},

	validate: async (data: {
		name: string;
		email: string;
		phone?: string;
	}) => {
		return apiFetch<{ isValid: boolean }>("/dealers/validate", {
			method: "POST",
			body: JSON.stringify(data),
		});
	},

	add: async (data: {
		name: string;
		email: string;
		phone?: string;
		address?: string;
	}) => {
		return apiFetch<DealerSchema>("/dealers", {
			method: "POST",
			body: JSON.stringify(data),
		});
	},

	update: async (
		id: string,
		data: {
			name: string;
			email: string;
			phone?: string | null;
			address?: string | null;
		},
	) => {
		return apiFetch<DealerSchema>(`/dealers/${id}`, {
			method: "PUT",
			body: JSON.stringify(data),
		});
	},

	toggleStatus: async (id: string) => {
		return apiFetch<DealerSchema>(`/dealers/${id}`, { method: "PATCH" });
	},
};

export const customerApi = {
	getAll: async () => {
		return apiFetch<CustomerSchema[]>("/customers", { method: "GET" });
	},

	validate: async (data: {
		name: string;
		email?: string;
		phone?: string;
	}) => {
		return apiFetch<{ isValid: boolean }>("/customers/validate", {
			method: "POST",
			body: JSON.stringify(data),
		});
	},

	add: async (data: {
		name: string;
		email?: string;
		phone?: string;
		address?: string;
	}) => {
		return apiFetch<CustomerSchema>("/customers", {
			method: "POST",
			body: JSON.stringify(data),
		});
	},

	getById: async (id: string) => {
		return apiFetch<{
			customer: any;
			dealers: string[];
			totalPurchases: number;
			purchases: PurchaseGroup[];
		}>(`/customers/${id}`, { method: "GET" });
	},

	getPurchaseHistory: async (id: string) => {
		return apiFetch<PurchaseGroup[]>(`/customers/${id}/purchases`, {
			method: "GET",
		});
	},

	update: async (
		id: string,
		data: {
			name: string;
			email: string;
			phone?: string | null;
			address?: string | null;
		},
	) => {
		return apiFetch<CustomerSchema>(`/customers/${id}`, {
			method: "PUT",
			body: JSON.stringify(data),
		});
	},
};

export const warrantyApi = {
	check: async (sn: string) => {
		return apiFetch<any>(`/warranty/check?sn=${encodeURIComponent(sn)}`, {
			method: "GET",
		});
	},
};

export const waitingListApi = {
	getAll: async () => {
		return apiFetch<WaitingListSchema[]>("/waiting-lists", { method: "GET" });
	},

	createPublic: async (data: {
		serialNumberRequested: string;
		requesterType: "end_user" | "dealer";
		requesterName: string;
		requesterEmail: string;
		requesterPhone: string;
		dealerId?: string;
	}) => {
		return apiFetch<WaitingListSchema>("/waiting-lists", {
			method: "POST",
			body: JSON.stringify(data),
		});
	},

	notify: async (
		id: string,
		notificationType: "check_sn" | "warranty_detail" | "dealer_ready",
	) => {
		return apiFetch<{ message: string }>(`/waiting-lists/${id}/notify`, {
			method: "POST",
			body: JSON.stringify({ notificationType }),
		});
	},
};

export const userApi = {
	getAll: async () => {
		return apiFetch<UserSchema[]>("/users", { method: "GET" });
	},

	add: async (data: {
		name: string;
		email: string;
		role: "admin" | "sales" | "dealer" | "technical_support";
		dealerName?: string | null;
		dealerPhone?: string | null;
		dealerAddress?: string | null;
	}) => {
		return apiFetch<UserSchema>("/users", {
			method: "POST",
			body: JSON.stringify(data),
		});
	},

	update: async (
		id: string,
		data: {
			name: string;
			role: "admin" | "sales" | "dealer" | "technical_support";
			status: "active" | "inactive";
		},
	) => {
		return apiFetch<UserSchema>(`/users/${id}`, {
			method: "PUT",
			body: JSON.stringify(data),
		});
	},

	delete: async (id: string) => {
		return apiFetch<UserSchema>(`/users/${id}`, { method: "DELETE" });
	},

	toggleStatus: async (id: string) => {
		return apiFetch<UserSchema>(`/users/${id}`, { method: "PATCH" });
	},

	resendVerification: async (id: string) => {
		return apiFetch<{ message: string }>(`/users/${id}/resend-verification`, {
			method: "POST",
		});
	},

	changeEmail: async (id: string, newEmail: string) => {
		return apiFetch<UserSchema>(`/users/${id}/change-email`, {
			method: "PUT",
			body: JSON.stringify({ newEmail }),
		});
	},
};

export const uploadApi = {
	validateAccurateFile: async (file: File) => {
		const formData = new FormData();
		formData.append("file", file);

		return apiFetch<{
			preview: any[];
			validCount: number;
			dupCount: number;
			unknownCount: number;
			shipTo?: string;
			doNumber?: string;
			parsedItems?: Array<{
				itemCode: string;
				itemDescription: string;
				qty: number;
				unit: string;
				serialNumbers: string[];
			}>;
		}>("/upload/validate", {
			method: "POST",
			body: formData,
		});
	},

	uploadAccurateFile: async (
		file: File,
		destType: "dealer" | "customer",
		destLabel: string,
		pendingDealerCreation?: any,
		pendingCustomerCreation?: any,
		pendingItemCodes?: any[],
		purchaseData?: any,
	) => {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("destType", destType);
		formData.append("destLabel", destLabel);
		if (pendingDealerCreation) {
			formData.append("pendingDealerCreation", JSON.stringify(pendingDealerCreation));
		}
		if (pendingCustomerCreation) {
			formData.append("pendingCustomerCreation", JSON.stringify(pendingCustomerCreation));
		}
		if (pendingItemCodes) {
			formData.append("pendingItemCodes", JSON.stringify(pendingItemCodes));
		}
		if (purchaseData) {
			// Remove invoiceFile since we can't send files in JSON
			const { invoiceFile, ...purchaseDataWithoutFile } = purchaseData;
			formData.append("purchaseData", JSON.stringify(purchaseDataWithoutFile));
		}

		return apiFetch<{
			success: boolean;
			doNumber: string;
			productsCreated: number;
		}>("/upload", {
			method: "POST",
			body: formData,
		});
	},
};
