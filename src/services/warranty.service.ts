import { db } from "@/db";
import { product, warrantyCondition } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Product, WarrantyStatus } from "@/types";
import { normalizeSerialNumber } from "@/lib/utils";

function calculateWarrantyStatus(
	startDate?: Date | string | null,
	endDate?: Date | string | null,
): WarrantyStatus {
	if (!startDate || !endDate) return "none";

	const today = new Date();
	const start = new Date(startDate);
	const end = new Date(endDate);

	if (today < start) return "none";
	if (today > end) return "expired";
	return "active";
}

function formatDateString(date?: Date | string | null): string | undefined {
	if (!date) return undefined;
	const d = new Date(date);
	return d.toISOString().split("T")[0];
}

export const warrantyService = {
	checkWarranty: async (serialNumber: string): Promise<Product | null> => {
		const result = await db.query.product.findFirst({
			where: eq(product.serialNumber, serialNumber),
			with: {
				productType: {
					with: {
						category: true,
					},
				},
				dealer: true,
				warrantyCondition: true,
			},
		});

		console.log(serialNumber);

		if (!result) return null;

		const warrantyStatus = calculateWarrantyStatus(
			result.warrantyStartDate,
			result.warrantyEndDate,
		);

		return {
			id: result.id,
			serialNumber: result.serialNumber,
			productType: result.productType.name,
			productCategory: result.productType.category.name,
			status: result.status,
			assignedDealerId: result.dealerId ?? undefined,
			assignedDealerName: result.dealer?.name ?? undefined,
			warrantyStatus,
			warrantyStartDate: formatDateString(result.warrantyStartDate),
			warrantyEndDate: formatDateString(result.warrantyEndDate),
			uploadedAt: result.createdAt.toISOString(),
			warrantyCondition: result.warrantyCondition?.condition ?? undefined,
			warrantyConditionNote: result.warrantyCondition?.reason ?? undefined,
			warrantyConditionUpdatedAt:
				result.warrantyCondition?.updatedAt.toISOString(),
		};
	},
};
