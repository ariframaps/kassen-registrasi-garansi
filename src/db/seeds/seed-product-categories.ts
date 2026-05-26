import { db } from "../";
import { productCategory } from "../schemas/product_category.schema";
import { productType } from "../schemas/product_type.schema";

export const CATEGORY_IDS = {
	powerTools: "cat_power_tools",
	handTools: "cat_hand_tools",
	measuringTools: "cat_measuring_tools",
	safetyEquipment: "cat_safety_equipment",
	gardenEquipment: "cat_garden_equipment",
};

export const PRODUCT_TYPE_IDS = {
	// Power Tools
	electricDrill: "pt_electric_drill",
	circularSaw: "pt_circular_saw",
	jigsaw: "pt_jigsaw",
	anglegrinder: "pt_angle_grinder",
	rotaryHammer: "pt_rotary_hammer",
	randomOrbitalSander: "pt_random_orbital_sander",
	impactDriver: "pt_impact_driver",

	// Hand Tools
	hammerSet: "pt_hammer_set",
	screwdriverSet: "pt_screwdriver_set",
	wrenchSet: "pt_wrench_set",
	pliersSet: "pt_pliers_set",
	handsaw: "pt_handsaw",

	// Measuring Tools
	laserDistanceMeter: "pt_laser_distance_meter",
	digitalVernier: "pt_digital_vernier",
	spiritLevel: "pt_spirit_level",
	tapeMeasure: "pt_tape_measure",

	// Safety Equipment
	safetyHelmet: "pt_safety_helmet",
	safetyGlasses: "pt_safety_glasses",
	earProtector: "pt_ear_protector",
	safetyGloves: "pt_safety_gloves",

	// Garden Equipment
	electricLawnMower: "pt_electric_lawn_mower",
	leafBlower: "pt_leaf_blower",
	chainsaw: "pt_chainsaw",
};

export async function seedProductCategories() {
	console.log("🌱 Seeding product categories...");

	const now = new Date();

	const categories = [
		{
			id: CATEGORY_IDS.powerTools,
			name: "Power Tools",
			createdAt: now,
			updatedAt: now,
		},
		{
			id: CATEGORY_IDS.handTools,
			name: "Hand Tools",
			createdAt: now,
			updatedAt: now,
		},
		{
			id: CATEGORY_IDS.measuringTools,
			name: "Measuring Tools",
			createdAt: now,
			updatedAt: now,
		},
		{
			id: CATEGORY_IDS.safetyEquipment,
			name: "Safety Equipment",
			createdAt: now,
			updatedAt: now,
		},
		{
			id: CATEGORY_IDS.gardenEquipment,
			name: "Garden Equipment",
			createdAt: now,
			updatedAt: now,
		},
	];

	await db.insert(productCategory).values(categories).onConflictDoNothing();
	console.log(`✅ Seeded ${categories.length} product categories`);
}

export async function seedProductTypes() {
	console.log("🌱 Seeding product types...");

	const now = new Date();

	const productTypes = [
		// Power Tools (24 months warranty)
		{
			id: PRODUCT_TYPE_IDS.electricDrill,
			categoryId: CATEGORY_IDS.powerTools,
			name: "Electric Drill 13mm",
			warrantyDurationMonths: 24,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: PRODUCT_TYPE_IDS.circularSaw,
			categoryId: CATEGORY_IDS.powerTools,
			name: "Circular Saw 185mm",
			warrantyDurationMonths: 24,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: PRODUCT_TYPE_IDS.jigsaw,
			categoryId: CATEGORY_IDS.powerTools,
			name: "Jigsaw 550W",
			warrantyDurationMonths: 24,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: PRODUCT_TYPE_IDS.anglegrinder,
			categoryId: CATEGORY_IDS.powerTools,
			name: "Angle Grinder 115mm",
			warrantyDurationMonths: 24,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: PRODUCT_TYPE_IDS.rotaryHammer,
			categoryId: CATEGORY_IDS.powerTools,
			name: "Rotary Hammer 26mm SDS-Plus",
			warrantyDurationMonths: 36,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: PRODUCT_TYPE_IDS.randomOrbitalSander,
			categoryId: CATEGORY_IDS.powerTools,
			name: "Random Orbital Sander 125mm",
			warrantyDurationMonths: 12,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: PRODUCT_TYPE_IDS.impactDriver,
			categoryId: CATEGORY_IDS.powerTools,
			name: "Impact Driver 18V",
			warrantyDurationMonths: 24,
			createdAt: now,
			updatedAt: now,
		},

		// Hand Tools (12 months warranty)
		{
			id: PRODUCT_TYPE_IDS.hammerSet,
			categoryId: CATEGORY_IDS.handTools,
			name: "Claw Hammer 500g",
			warrantyDurationMonths: 12,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: PRODUCT_TYPE_IDS.screwdriverSet,
			categoryId: CATEGORY_IDS.handTools,
			name: "Screwdriver Set 12pcs",
			warrantyDurationMonths: 12,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: PRODUCT_TYPE_IDS.wrenchSet,
			categoryId: CATEGORY_IDS.handTools,
			name: "Combination Wrench Set 8-22mm",
			warrantyDurationMonths: 12,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: PRODUCT_TYPE_IDS.pliersSet,
			categoryId: CATEGORY_IDS.handTools,
			name: "Pliers Set 5pcs",
			warrantyDurationMonths: 12,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: PRODUCT_TYPE_IDS.handsaw,
			categoryId: CATEGORY_IDS.handTools,
			name: "Hand Saw 550mm",
			warrantyDurationMonths: 12,
			createdAt: now,
			updatedAt: now,
		},

		// Measuring Tools (12 months warranty)
		{
			id: PRODUCT_TYPE_IDS.laserDistanceMeter,
			categoryId: CATEGORY_IDS.measuringTools,
			name: "Laser Distance Meter 50m",
			warrantyDurationMonths: 24,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: PRODUCT_TYPE_IDS.digitalVernier,
			categoryId: CATEGORY_IDS.measuringTools,
			name: "Digital Vernier Caliper 150mm",
			warrantyDurationMonths: 12,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: PRODUCT_TYPE_IDS.spiritLevel,
			categoryId: CATEGORY_IDS.measuringTools,
			name: "Spirit Level 600mm",
			warrantyDurationMonths: 12,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: PRODUCT_TYPE_IDS.tapeMeasure,
			categoryId: CATEGORY_IDS.measuringTools,
			name: "Steel Tape Measure 5m",
			warrantyDurationMonths: 12,
			createdAt: now,
			updatedAt: now,
		},

		// Safety Equipment (6 months warranty)
		{
			id: PRODUCT_TYPE_IDS.safetyHelmet,
			categoryId: CATEGORY_IDS.safetyEquipment,
			name: "Safety Helmet ABS Class B",
			warrantyDurationMonths: 6,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: PRODUCT_TYPE_IDS.safetyGlasses,
			categoryId: CATEGORY_IDS.safetyEquipment,
			name: "Safety Glasses Anti-Fog",
			warrantyDurationMonths: 6,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: PRODUCT_TYPE_IDS.earProtector,
			categoryId: CATEGORY_IDS.safetyEquipment,
			name: "Ear Protector 30dB",
			warrantyDurationMonths: 6,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: PRODUCT_TYPE_IDS.safetyGloves,
			categoryId: CATEGORY_IDS.safetyEquipment,
			name: "Cut Resistant Safety Gloves L",
			warrantyDurationMonths: 3,
			createdAt: now,
			updatedAt: now,
		},

		// Garden Equipment (12-24 months)
		{
			id: PRODUCT_TYPE_IDS.electricLawnMower,
			categoryId: CATEGORY_IDS.gardenEquipment,
			name: "Electric Lawn Mower 1800W",
			warrantyDurationMonths: 24,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: PRODUCT_TYPE_IDS.leafBlower,
			categoryId: CATEGORY_IDS.gardenEquipment,
			name: "Leaf Blower 550W",
			warrantyDurationMonths: 12,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: PRODUCT_TYPE_IDS.chainsaw,
			categoryId: CATEGORY_IDS.gardenEquipment,
			name: "Electric Chainsaw 2000W 35cm",
			warrantyDurationMonths: 24,
			createdAt: now,
			updatedAt: now,
		},
	];

	await db.insert(productType).values(productTypes).onConflictDoNothing();
	console.log(`✅ Seeded ${productTypes.length} product types`);
}
