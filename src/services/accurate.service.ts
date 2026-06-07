import { db } from "@/db";
import {
	itemCodeMapping,
	product,
	productType,
	productCategory,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
	ParsedDeliveryOrder,
	PreviewRow,
} from "@/lib/parser-accurate";
import { normalizeSerialNumber } from "@/lib/utils";

export const uploadAccurateSchema = z.object({
	destType: z.enum(["dealer", "customer"]),
	destLabel: z.string().min(1, "Destination label diperlukan"),
});

export type UploadAccuratePayload = z.infer<typeof uploadAccurateSchema>;

async function findProductTypeByItemCode(
	itemCode: string,
): Promise<{ productTypeId: string; productTypeName: string; categoryName: string } | null> {
	const mapping = await db
		.select({
			productTypeId: itemCodeMapping.productTypeId,
			productTypeName: productType.name,
			categoryName: productCategory.name,
		})
		.from(itemCodeMapping)
		.innerJoin(productType, eq(itemCodeMapping.productTypeId, productType.id))
		.innerJoin(
			productCategory,
			eq(productType.categoryId, productCategory.id),
		)
		.where(eq(itemCodeMapping.itemCode, itemCode))
		.limit(1);

	return mapping[0] || null;
}

async function isSerialNumberDuplicate(serialNumber: string): Promise<boolean> {
	const existing = await db
		.select({ id: product.id })
		.from(product)
		.where(eq(product.serialNumber, normalizeSerialNumber(serialNumber)))
		.limit(1);

	return existing.length > 0;
}

export async function validateAccurateFile(
	parsedData: ParsedDeliveryOrder,
): Promise<PreviewRow[]> {
	const results: PreviewRow[] = [];

	// Flatten items dengan serialNumbers
	for (const item of parsedData.items) {
		const { itemCode, serialNumbers } = item;

		// Cek itemCode di database
		const mapping = await findProductTypeByItemCode(itemCode);

		if (!mapping) {
			// Item code tidak ditemukan
			for (const sn of serialNumbers) {
				results.push({
					serialNumber: sn,
					productType: "",
					productCategory: "",
					itemCodeOriginal: itemCode,
					status: "unknown_type",
					message: `Item code '${itemCode}' belum ada mapping`,
				});
			}
			continue;
		}

		// Item code ditemukan, cek setiap serial number
		for (const sn of serialNumbers) {
			const normalized = normalizeSerialNumber(sn);
			const isDuplicate = await isSerialNumberDuplicate(normalized);

			if (isDuplicate) {
				results.push({
					serialNumber: sn,
					productType: mapping.productTypeName,
					productCategory: mapping.categoryName,
					status: "duplicate",
					message: "SN sudah ada di sistem",
				});
			} else {
				results.push({
					serialNumber: sn,
					productType: mapping.productTypeName,
					productCategory: mapping.categoryName,
					status: "valid",
				});
			}
		}
	}

	return results;
}

export const accurateService = {
	validateAccurateFile,
	upload: async (
		file: File,
		payload: UploadAccuratePayload,
		context: { userId: string; ipAddress?: string | null; userAgent?: string | null },
	) => {
		// Implement actual upload logic here
		// This is a placeholder that would need full implementation
		return {
			doId: "DO-TEMP",
			doNumber: "DO.2026.02.24.001",
			productsCreated: 0,
			purchaseCreated: false,
		};
	},
};
