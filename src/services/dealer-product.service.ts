import { HTTP_STATUS } from "@/constants/http-status.constant";
import { db } from "@/db";
import { dealers, product, productType, warrantyCondition, auditLog, purchaseItem } from "@/db/schema";
import { HttpError } from "@/lib/api/http-error";
import { and, eq, ilike, or, inArray } from "drizzle-orm";
import z from "zod";

interface DealerProductFilterParams {
	userId: string;
	page: number;
	pageSize: number;
	search?: string;
	categoryId?: string;
}

export interface DealerProductResponse {
	id: string;
	serialNumber: string;
	productType: string;
	productCategory: string;
	warrantyStatus: "none" | "active" | "expired";
	customerName: null;
	warrantyStartDate: string | null;
	warrantyEndDate: string | null;
	isRegistered: boolean;
}

export const dealerProductService = {
	getDealerProducts: async (
		params: DealerProductFilterParams,
	): Promise<{
		items: DealerProductResponse[];
		total: number;
		page: number;
		pageSize: number;
		dealerId: string;
	}> => {
		// Get dealer by userId
		const dealer = await db.query.dealers.findFirst({
			where: eq(dealers.userId, params.userId),
		});

		if (!dealer) {
			throw new HttpError(
				"Dealer tidak ditemukan untuk user ini",
				HTTP_STATUS.NOT_FOUND.code,
			);
		}

		const limit = Math.min(params.pageSize, 100);
		const offset = (params.page - 1) * limit;

		const filters: unknown[] = [eq(product.dealerId, dealer.id)];

		if (params.search) {
			filters.push(
				or(
					ilike(product.serialNumber, `%${params.search}%`),
					ilike(productType.name, `%${params.search}%`),
				),
			);
		}

		const whereClause = filters.length > 1 ? and(...filters) : filters[0];

		const result = await db.query.product.findMany({
			where: whereClause,
			with: {
				productType: {
					with: {
						category: true,
					},
				},
				warrantyCondition: true,
			},
			limit,
			offset,
		});

		const totalResult = await db.query.product.findMany({
			where: whereClause,
		});

		// Check which products are already registered (linked to purchaseItem)
		const registeredProductIds = await db
			.select({ productId: purchaseItem.productId })
			.from(purchaseItem)
			.where(inArray(purchaseItem.productId, result.map((p) => p.id)));

		const registeredIdSet = new Set(registeredProductIds.map((r) => r.productId));

		const formatDate = (date: string | Date | null): string | null => {
			if (!date) return null;
			if (typeof date === "string") return date;
			return date.toISOString().split("T")[0];
		};

		const data: DealerProductResponse[] = result.map((p) => ({
			id: p.id,
			serialNumber: p.serialNumber,
			productType: p.productType.name,
			productCategory: p.productType.category.name,
			warrantyStatus:
				p.status === "none"
					? ("none" as const)
					: p.warrantyEndDate && new Date(p.warrantyEndDate) < new Date()
						? ("expired" as const)
						: ("active" as const),
			customerName: null,
			warrantyStartDate: formatDate(p.warrantyStartDate),
			warrantyEndDate: formatDate(p.warrantyEndDate),
			isRegistered: registeredIdSet.has(p.id),
		}));

		return {
			items: data,
			total: totalResult.length,
			page: params.page,
			pageSize: limit,
			dealerId: dealer.id,
		};
	},
};
