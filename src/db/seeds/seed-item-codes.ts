import { db } from "../";
import { itemCodeMapping } from "../schemas/item_code_mapping.schema";
import { PRODUCT_TYPE_IDS } from "./seed-product-categories";

export async function seedItemCodeMappings() {
	console.log("🌱 Seeding item code mappings...");

	const now = new Date();

	const itemCodes = [
		// Power Tools
		{
			id: "icm_001",
			itemCode: "PWR-DRILL-13",
			productTypeId: PRODUCT_TYPE_IDS.electricDrill,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: "icm_002",
			itemCode: "PWR-SAW-185",
			productTypeId: PRODUCT_TYPE_IDS.circularSaw,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: "icm_003",
			itemCode: "PWR-JIG-550",
			productTypeId: PRODUCT_TYPE_IDS.jigsaw,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: "icm_004",
			itemCode: "PWR-GRIND-115",
			productTypeId: PRODUCT_TYPE_IDS.anglegrinder,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: "icm_005",
			itemCode: "PWR-RHAM-26",
			productTypeId: PRODUCT_TYPE_IDS.rotaryHammer,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: "icm_006",
			itemCode: "PWR-SAND-125",
			productTypeId: PRODUCT_TYPE_IDS.randomOrbitalSander,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: "icm_007",
			itemCode: "PWR-IMPD-18V",
			productTypeId: PRODUCT_TYPE_IDS.impactDriver,
			createdAt: now,
			updatedAt: now,
		},

		// Hand Tools
		{
			id: "icm_008",
			itemCode: "HND-HAMR-500",
			productTypeId: PRODUCT_TYPE_IDS.hammerSet,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: "icm_009",
			itemCode: "HND-SCRW-12",
			productTypeId: PRODUCT_TYPE_IDS.screwdriverSet,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: "icm_010",
			itemCode: "HND-WRNC-8-22",
			productTypeId: PRODUCT_TYPE_IDS.wrenchSet,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: "icm_011",
			itemCode: "HND-PLRS-5",
			productTypeId: PRODUCT_TYPE_IDS.pliersSet,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: "icm_012",
			itemCode: "HND-HSAW-550",
			productTypeId: PRODUCT_TYPE_IDS.handsaw,
			createdAt: now,
			updatedAt: now,
		},

		// Measuring Tools
		{
			id: "icm_013",
			itemCode: "MSR-LASR-50",
			productTypeId: PRODUCT_TYPE_IDS.laserDistanceMeter,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: "icm_014",
			itemCode: "MSR-VERN-150",
			productTypeId: PRODUCT_TYPE_IDS.digitalVernier,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: "icm_015",
			itemCode: "MSR-LVLR-600",
			productTypeId: PRODUCT_TYPE_IDS.spiritLevel,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: "icm_016",
			itemCode: "MSR-TAPE-5M",
			productTypeId: PRODUCT_TYPE_IDS.tapeMeasure,
			createdAt: now,
			updatedAt: now,
		},

		// Safety Equipment
		{
			id: "icm_017",
			itemCode: "SFT-HELM-ABS",
			productTypeId: PRODUCT_TYPE_IDS.safetyHelmet,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: "icm_018",
			itemCode: "SFT-GLSS-AF",
			productTypeId: PRODUCT_TYPE_IDS.safetyGlasses,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: "icm_019",
			itemCode: "SFT-EARR-30",
			productTypeId: PRODUCT_TYPE_IDS.earProtector,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: "icm_020",
			itemCode: "SFT-GLVS-CR",
			productTypeId: PRODUCT_TYPE_IDS.safetyGloves,
			createdAt: now,
			updatedAt: now,
		},

		// Garden Equipment
		{
			id: "icm_021",
			itemCode: "GRD-MWER-1800",
			productTypeId: PRODUCT_TYPE_IDS.electricLawnMower,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: "icm_022",
			itemCode: "GRD-BLWR-550",
			productTypeId: PRODUCT_TYPE_IDS.leafBlower,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: "icm_023",
			itemCode: "GRD-CSAW-2000",
			productTypeId: PRODUCT_TYPE_IDS.chainsaw,
			createdAt: now,
			updatedAt: now,
		},
	];

	await db.insert(itemCodeMapping).values(itemCodes).onConflictDoNothing();
	console.log(`✅ Seeded ${itemCodes.length} item code mappings`);
}
