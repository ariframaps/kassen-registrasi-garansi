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

async function apiFetch<T>(
	input: RequestInfo,
	init?: RequestInit,
): Promise<ApiResponse<T>> {
	const response = await fetch("/api/v1" + input, {
		headers: {
			"Content-Type": "application/json",
			...(init?.headers || {}),
		},
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
};

export const productTypeApi = {
	getAllWithNested: async () => {
		return apiFetch<ProductTypeWithNestedSchema[]>("/product-types", {
			method: "GET",
		});
	},

	getItemCodes: async ({ typeId }: { typeId: string }) => {
		return apiFetch<ItemCodeMapsSchema[]>(`/product-types/${typeId}/codes`, {
			method: "GET",
		});
	},

	editCodes: async ({
		typeId,
		data,
	}: {
		typeId: string;
		data: {
			deleted: string[];
			added: string[];
		};
	}) => {
		return apiFetch<ItemCodeMapsSchema[]>(`/product-types/${typeId}/codes`, {
			method: "PATCH",
			body: JSON.stringify({ typeId, data }),
		});
	},

	addNew: async (data: ProductTypeInsertSchema) => {
		return apiFetch<ProductTypeWithNestedSchema>(`/product-types`, {
			method: "POST",
			body: JSON.stringify(data),
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
			{
				method: "GET",
			},
		);
	},
};

export const dealerApi = {
	getAll: async () => {
		return apiFetch<DealerSchema[]>("/dealers", { method: "GET" });
	},
};

export const customerApi = {
	getAll: async () => {
		return apiFetch<CustomerSchema[]>("/customers", { method: "GET" });
	},
};

export const waitingListApi = {
	getAll: async () => {
		return apiFetch<WaitingListSchema[]>("/waiting-lists", { method: "GET" });
	},
};

export const userApi = {
	getAll: async () => {
		return apiFetch<UserSchema[]>("/users", { method: "GET" });
	},
};
