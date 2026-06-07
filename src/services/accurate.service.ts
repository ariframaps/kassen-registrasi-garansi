import { db } from "@/db";
import { product, deliveryOrders, dealers, customer, productType, itemCodeMaps } from "@/db/schema";
import { parseExcelFile, validateAndPreview, ParsedDeliveryOrder, PreviewRow } from "@/lib/parser-accurate";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function getProductTypeMappings() {
	const types = await db.query.productType.findMany({
		with: {
			category: true,
			itemCodeMappings: true,
		},
	});

	const map = new Map<string, { id: string; category: string; name: string }>();

	for (const pt of types) {
		for (const ic of pt.itemCodeMappings) {
			map.set(ic.itemCode, {
				id: pt.id,
				category: pt.category.name,
				name: pt.name,
			});
		}
	}

	return map;
}

export async function getExistingSerialNumbers(): Promise<Set<string>> {
	const products = await db.select({ serialNumber: product.serialNumber }).from(product);
	return new Set(products.map((p) => p.serialNumber));
}

export interface UploadValidationResult {
	preview: PreviewRow[];
	validCount: number;
	dupCount: number;
	unknownCount: number;
	parsed: ParsedDeliveryOrder;
}

export async function validateAccurateFile(
	file: File,
): Promise<UploadValidationResult> {
	const [parsed, existingSerials, typeMap] = await Promise.all([
		parseExcelFile(file),
		getExistingSerialNumbers(),
		getProductTypeMappings(),
	]);

	const { preview, validCount, dupCount, unknownCount } = validateAndPreview(
		parsed,
		existingSerials,
		typeMap,
	);

	return {
		preview,
		validCount,
		dupCount,
		unknownCount,
		parsed,
	};
}

export interface UploadSubmitOptions {
	destType: "dealer" | "customer";
	destLabel: string;
	userId: string;
	file: File;
}

export async function submitAccurateFile(
	options: UploadSubmitOptions,
): Promise<{
	doNumber: string;
	productsCreated: number;
}> {
	const { destType, destLabel, userId, file } = options;

	const validation = await validateAccurateFile(file);
	const { parsed, preview } = validation;

	if (validation.validCount === 0) {
		throw new Error("Tidak ada produk valid untuk disimpan");
	}

	// Calculate file hash
	const buffer = await file.arrayBuffer();
	const hash = crypto
		.createHash("sha256")
		.update(Buffer.from(buffer))
		.digest("hex");

	// Check if DO already uploaded
	const existing = await db.query.deliveryOrders.findFirst({
		where: eq(deliveryOrders.fileHash, hash),
	});

	if (existing) {
		throw new Error("File ini sudah pernah diupload sebelumnya");
	}

	// Get dealer or customer ID
	let dealerId: string | null = null;
	let customerId: string | null = null;

	if (destType === "dealer") {
		const dealer = await db.query.dealers.findFirst({
			where: eq(dealers.name, destLabel),
		});
		if (!dealer) {
			throw new Error(`Dealer '${destLabel}' tidak ditemukan`);
		}
		dealerId = dealer.id;
	} else {
		const found = await db.query.customer.findFirst({
			where: eq(customer.name, destLabel),
		});
		if (!found) {
			throw new Error(`Customer '${destLabel}' tidak ditemukan`);
		}
		customerId = found.id;
	}

	// Create DO record
	const doRecord = await db
		.insert(deliveryOrders)
		.values({
			doNumber: parsed.doNumber,
			doDate: parsed.date,
			shipToRaw: parsed.shipTo,
			sentBy: parsed.sentBy || null,
			orderRef: parsed.orderRef || null,
			dcRef: parsed.area || null,
			destinationType: destType,
			destinationDealerId: dealerId,
			destinationCustomerId: customerId,
			uploadedBy: userId,
			fileHash: hash,
			originalFilename: file.name,
		})
		.returning();

	const doId = doRecord[0].id;

	// Get product type mapping again for save
	const typeMap = await getProductTypeMappings();

	// Create product records by matching preview with parsed items
	const productsToCreate = [];
	const validSerialNumbers = new Set(
		preview.filter((p) => p.status === "valid").map((p) => p.serialNumber),
	);

	for (const item of parsed.items) {
		const mapping = typeMap.get(item.itemCode);
		if (!mapping) continue;

		for (const sn of item.serialNumbers) {
			if (validSerialNumbers.has(sn)) {
				productsToCreate.push({
					serialNumber: sn,
					productTypeId: mapping.id,
					deliveryOrderId: doId,
					dealerId: dealerId,
					status: "none" as const,
				});
			}
		}
	}

	if (productsToCreate.length > 0) {
		await db.insert(product).values(productsToCreate);
	}

	return {
		doNumber: parsed.doNumber,
		productsCreated: productsToCreate.length,
	};
}
