import { db } from "../";
import { product } from "../schemas/product.schema";
import { PRODUCT_TYPE_IDS } from "./seed-product-categories";
import { DEALER_IDS } from "./seed-dealers";
import { DELIVERY_ORDER_IDS } from "./seed-delivery-orders";
import { ProductStatus } from "@/types";

// All product type IDs in an array for easy cycling
const allProductTypeIds = Object.values(PRODUCT_TYPE_IDS);

// Map product type to appropriate delivery order to keep it consistent
const productTypeToDoMap: Record<string, string> = {
	[PRODUCT_TYPE_IDS.electricDrill]: DELIVERY_ORDER_IDS[0],
	[PRODUCT_TYPE_IDS.circularSaw]: DELIVERY_ORDER_IDS[0],
	[PRODUCT_TYPE_IDS.jigsaw]: DELIVERY_ORDER_IDS[1],
	[PRODUCT_TYPE_IDS.anglegrinder]: DELIVERY_ORDER_IDS[1],
	[PRODUCT_TYPE_IDS.rotaryHammer]: DELIVERY_ORDER_IDS[2],
	[PRODUCT_TYPE_IDS.randomOrbitalSander]: DELIVERY_ORDER_IDS[2],
	[PRODUCT_TYPE_IDS.impactDriver]: DELIVERY_ORDER_IDS[3],
	[PRODUCT_TYPE_IDS.hammerSet]: DELIVERY_ORDER_IDS[3],
	[PRODUCT_TYPE_IDS.screwdriverSet]: DELIVERY_ORDER_IDS[4],
	[PRODUCT_TYPE_IDS.wrenchSet]: DELIVERY_ORDER_IDS[4],
	[PRODUCT_TYPE_IDS.pliersSet]: DELIVERY_ORDER_IDS[5],
	[PRODUCT_TYPE_IDS.handsaw]: DELIVERY_ORDER_IDS[5],
	[PRODUCT_TYPE_IDS.laserDistanceMeter]: DELIVERY_ORDER_IDS[6],
	[PRODUCT_TYPE_IDS.digitalVernier]: DELIVERY_ORDER_IDS[6],
	[PRODUCT_TYPE_IDS.spiritLevel]: DELIVERY_ORDER_IDS[7],
	[PRODUCT_TYPE_IDS.tapeMeasure]: DELIVERY_ORDER_IDS[7],
	[PRODUCT_TYPE_IDS.safetyHelmet]: DELIVERY_ORDER_IDS[8],
	[PRODUCT_TYPE_IDS.safetyGlasses]: DELIVERY_ORDER_IDS[8],
	[PRODUCT_TYPE_IDS.earProtector]: DELIVERY_ORDER_IDS[9],
	[PRODUCT_TYPE_IDS.safetyGloves]: DELIVERY_ORDER_IDS[9],
	[PRODUCT_TYPE_IDS.electricLawnMower]: DELIVERY_ORDER_IDS[10],
	[PRODUCT_TYPE_IDS.leafBlower]: DELIVERY_ORDER_IDS[10],
	[PRODUCT_TYPE_IDS.chainsaw]: DELIVERY_ORDER_IDS[11],
};

function pad(n: number): string {
	return String(n).padStart(5, "0");
}

function generateSerialNumber(typeKey: string, index: number): string {
	const prefix = typeKey
		.replace("pt_", "")
		.toUpperCase()
		.slice(0, 6)
		.replace(/_/g, "");

	return `SN-${prefix}-${pad(index)}`;
}

function addMonths(date: Date, months: number): string {
	const d = new Date(date);
	d.setMonth(d.getMonth() + months);

	return d.toISOString().split("T")[0];
}

export const PRODUCT_IDS: string[] = [];
export const ASSIGNED_PRODUCT_IDS: string[] = [];
export const WARRANTY_PRODUCT_IDS: string[] = [];

export async function seedProducts() {
	console.log("🌱 Seeding 100 products...");

	const now = new Date();

	const products: (typeof product.$inferInsert)[] = [];

	const dealerIds = [DEALER_IDS.pratama, DEALER_IDS.maju, DEALER_IDS.sakti];

	/**
	 * Product scenarios:
	 *
	 * 20 -> direct sales, warranty active
	 * 10 -> direct sales, warranty expired
	 * 30 -> dealer stock (not sold yet)
	 * 25 -> dealer sold, warranty active
	 * 15 -> dealer sold, warranty expired
	 */
	const statusPlan: Array<{
		status: ProductStatus;
		warranty: boolean;
		hasDealer: boolean;
	}> = [
		...Array(20).fill({
			status: "warranty_active",
			warranty: true,
			hasDealer: false,
		}),

		...Array(10).fill({
			status: "warranty_expired",
			warranty: true,
			hasDealer: false,
		}),

		...Array(30).fill({
			status: "none",
			warranty: false,
			hasDealer: true,
		}),

		...Array(25).fill({
			status: "warranty_active",
			warranty: true,
			hasDealer: true,
		}),

		...Array(15).fill({
			status: "warranty_expired",
			warranty: true,
			hasDealer: true,
		}),
	];

	for (let i = 0; i < 100; i++) {
		const productId = `prod_${pad(i + 1)}`;

		PRODUCT_IDS.push(productId);

		const typeKey = Object.keys(PRODUCT_TYPE_IDS)[
			i % allProductTypeIds.length
		] as keyof typeof PRODUCT_TYPE_IDS;

		const productTypeId = PRODUCT_TYPE_IDS[typeKey];

		const deliveryOrderId =
			productTypeToDoMap[productTypeId] ??
			DELIVERY_ORDER_IDS[i % DELIVERY_ORDER_IDS.length];

		const { status, warranty, hasDealer } = statusPlan[i];

		// dealer assignment
		const dealerId = hasDealer ? dealerIds[i % dealerIds.length] : null;

		if (dealerId) {
			ASSIGNED_PRODUCT_IDS.push(productId);
		}

		if (warranty) {
			WARRANTY_PRODUCT_IDS.push(productId);
		}

		// warranty dates
		const baseDate = new Date("2024-01-01");

		baseDate.setDate(baseDate.getDate() + i * 3);

		const warrantyStartDate = warranty
			? baseDate.toISOString().split("T")[0]
			: null;

		const warrantyMonths = status === "warranty_expired" ? 12 : 24;

		const warrantyEndDate = warranty
			? addMonths(baseDate, warrantyMonths)
			: null;

		products.push({
			id: productId,
			serialNumber: generateSerialNumber(typeKey, i + 1),
			productTypeId,
			deliveryOrderId,
			dealerId,
			status,
			warrantyStartDate,
			warrantyEndDate,
			createdAt: now,
			updatedAt: now,
		});
	}

	await db.insert(product).values(products).onConflictDoNothing();

	console.log(`✅ Seeded ${products.length} products`);
}
