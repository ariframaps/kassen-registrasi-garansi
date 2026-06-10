import { db } from "../";
import { productCategory } from "../schemas/product_category.schema";
import { productType } from "../schemas/product_type.schema";
import { CategorySchema, ProductTypeSchema } from "../schema";

// Mutable maps untuk store IDs yang di-generate saat seed dijalankan
const _categoryIds: Record<string, string> = {};
const _productTypeIds: Record<string, string> = {};

// Public interface untuk access generated IDs
export const CATEGORY_IDS = {
	get powerTools() { return _categoryIds.powerTools; },
	get handTools() { return _categoryIds.handTools; },
	get measuringTools() { return _categoryIds.measuringTools; },
	get safetyEquipment() { return _categoryIds.safetyEquipment; },
	get gardenEquipment() { return _categoryIds.gardenEquipment; },
};

export const PRODUCT_TYPE_IDS = {
	get electricDrill() { return _productTypeIds.electricDrill; },
	get circularSaw() { return _productTypeIds.circularSaw; },
	get jigsaw() { return _productTypeIds.jigsaw; },
	get anglegrinder() { return _productTypeIds.anglegrinder; },
	get rotaryHammer() { return _productTypeIds.rotaryHammer; },
	get randomOrbitalSander() { return _productTypeIds.randomOrbitalSander; },
	get impactDriver() { return _productTypeIds.impactDriver; },
	get hammerSet() { return _productTypeIds.hammerSet; },
	get screwdriverSet() { return _productTypeIds.screwdriverSet; },
	get wrenchSet() { return _productTypeIds.wrenchSet; },
	get pliersSet() { return _productTypeIds.pliersSet; },
	get handsaw() { return _productTypeIds.handsaw; },
	get laserDistanceMeter() { return _productTypeIds.laserDistanceMeter; },
	get digitalVernier() { return _productTypeIds.digitalVernier; },
	get spiritLevel() { return _productTypeIds.spiritLevel; },
	get tapeMeasure() { return _productTypeIds.tapeMeasure; },
	get safetyHelmet() { return _productTypeIds.safetyHelmet; },
	get safetyGlasses() { return _productTypeIds.safetyGlasses; },
	get earProtector() { return _productTypeIds.earProtector; },
	get safetyGloves() { return _productTypeIds.safetyGloves; },
	get electricLawnMower() { return _productTypeIds.electricLawnMower; },
	get leafBlower() { return _productTypeIds.leafBlower; },
	get chainsaw() { return _productTypeIds.chainsaw; },
};

export async function seedProductCategories() {
	console.log("🌱 Seeding product categories...");

	const now = new Date();

	// Generate UUIDs for categories - EXPLICIT to avoid duplicate UUID bug
	const categories = [
		{
			id: crypto.randomUUID(),
			name: "Power Tools",
			createdAt: now,
			updatedAt: now,
		},
		{
			id: crypto.randomUUID(),
			name: "Hand Tools",
			createdAt: now,
			updatedAt: now,
		},
		{
			id: crypto.randomUUID(),
			name: "Measuring Tools",
			createdAt: now,
			updatedAt: now,
		},
		{
			id: crypto.randomUUID(),
			name: "Safety Equipment",
			createdAt: now,
			updatedAt: now,
		},
		{
			id: crypto.randomUUID(),
			name: "Garden Equipment",
			createdAt: now,
			updatedAt: now,
		},
	];

	console.log(`📝 Attempting to insert ${categories.length} categories:`, categories.map((c) => c.name).join(", "));

	let inserted: CategorySchema[] = [];
	try {
		inserted = await db
			.insert(productCategory)
			.values(categories)
			// REMOVE onConflictDoNothing() to see actual error
			.returning();
		console.log(`✓ Insert returned ${inserted.length} rows:`, inserted.map((c) => c.name).join(", "));
	} catch (error) {
		console.error("❌ Insert failed with error:", error);
		throw error;
	}

	// Store generated IDs - SELALU fetch dari DB untuk ensure semua category terisi
	const categoryNames = ["Power Tools", "Hand Tools", "Measuring Tools", "Safety Equipment", "Garden Equipment"] as const;
	const categoryKeys = ["powerTools", "handTools", "measuringTools", "safetyEquipment", "gardenEquipment"] as const;

	// Fetch ALL categories dari DB untuk populate map
	console.log("🔍 Fetching all categories from database...");
	for (let i = 0; i < categoryNames.length; i++) {
		const catName = categoryNames[i];
		console.log(`  → Looking for: "${catName}"`);
		const cat = await db.query.productCategory.findFirst({
			where: (tbl, { eq }) => eq(tbl.name, catName),
		});
		if (!cat) {
			console.error(`❌ Category "${catName}" not found!`);
			const allCats = await db.query.productCategory.findMany();
			console.error(`Available categories in DB:`, allCats.map((c) => c.name).join(", "));
			throw new Error(`Category "${catName}" not found in database after insert attempt.`);
		}
		_categoryIds[categoryKeys[i]] = cat.id;
		console.log(`  ✓ Found with ID: ${cat.id}`);
	}

	console.log(`✅ Seeded ${inserted.length || 5} categories, all ${Object.keys(_categoryIds).length} fetched successfully`);
}

export async function seedProductTypes() {
	console.log("🌱 Seeding product types...");

	const now = new Date();

	const productTypeDefinitions = [
		// Power Tools (24 months warranty)
		{ key: "electricDrill", categoryKey: "powerTools", name: "Electric Drill 13mm", warranty: 24 },
		{ key: "circularSaw", categoryKey: "powerTools", name: "Circular Saw 185mm", warranty: 24 },
		{ key: "jigsaw", categoryKey: "powerTools", name: "Jigsaw 550W", warranty: 24 },
		{ key: "anglegrinder", categoryKey: "powerTools", name: "Angle Grinder 115mm", warranty: 24 },
		{ key: "rotaryHammer", categoryKey: "powerTools", name: "Rotary Hammer 26mm SDS-Plus", warranty: 36 },
		{ key: "randomOrbitalSander", categoryKey: "powerTools", name: "Random Orbital Sander 125mm", warranty: 12 },
		{ key: "impactDriver", categoryKey: "powerTools", name: "Impact Driver 18V", warranty: 24 },
		// Hand Tools
		{ key: "hammerSet", categoryKey: "handTools", name: "Claw Hammer 500g", warranty: 12 },
		{ key: "screwdriverSet", categoryKey: "handTools", name: "Screwdriver Set 12pcs", warranty: 12 },
		{ key: "wrenchSet", categoryKey: "handTools", name: "Combination Wrench Set 8-22mm", warranty: 12 },
		{ key: "pliersSet", categoryKey: "handTools", name: "Pliers Set 5pcs", warranty: 12 },
		{ key: "handsaw", categoryKey: "handTools", name: "Hand Saw 550mm", warranty: 12 },
		// Measuring Tools
		{ key: "laserDistanceMeter", categoryKey: "measuringTools", name: "Laser Distance Meter 50m", warranty: 24 },
		{ key: "digitalVernier", categoryKey: "measuringTools", name: "Digital Vernier Caliper 150mm", warranty: 12 },
		{ key: "spiritLevel", categoryKey: "measuringTools", name: "Spirit Level 600mm", warranty: 12 },
		{ key: "tapeMeasure", categoryKey: "measuringTools", name: "Steel Tape Measure 5m", warranty: 12 },
		// Safety Equipment
		{ key: "safetyHelmet", categoryKey: "safetyEquipment", name: "Safety Helmet ABS Class B", warranty: 6 },
		{ key: "safetyGlasses", categoryKey: "safetyEquipment", name: "Safety Glasses Anti-Fog", warranty: 6 },
		{ key: "earProtector", categoryKey: "safetyEquipment", name: "Ear Protector 30dB", warranty: 6 },
		{ key: "safetyGloves", categoryKey: "safetyEquipment", name: "Cut Resistant Safety Gloves L", warranty: 3 },
		// Garden Equipment
		{ key: "electricLawnMower", categoryKey: "gardenEquipment", name: "Electric Lawn Mower 1800W", warranty: 24 },
		{ key: "leafBlower", categoryKey: "gardenEquipment", name: "Leaf Blower 550W", warranty: 12 },
		{ key: "chainsaw", categoryKey: "gardenEquipment", name: "Electric Chainsaw 2000W 35cm", warranty: 24 },
	];

	const productTypes = productTypeDefinitions.map((pt) => {
		const categoryId = _categoryIds[pt.categoryKey];
		if (!categoryId) {
			throw new Error(`Category not found for key: ${pt.categoryKey}. Available: ${Object.keys(_categoryIds).join(", ")}`);
		}
		return {
			id: crypto.randomUUID(), // EXPLICIT UUID to avoid duplicate UUID bug
			categoryId,
			name: pt.name,
			warrantyDurationMonths: pt.warranty,
			createdAt: now,
			updatedAt: now,
		};
	});

	console.log(`📝 Attempting to insert ${productTypeDefinitions.length} product types`);

	let inserted: ProductTypeSchema[] = [];
	try {
		inserted = await db
			.insert(productType)
			.values(productTypes)
			// REMOVE onConflictDoNothing() to see actual error
			.returning();
		console.log(`✓ Insert returned ${inserted.length} rows`);
	} catch (error) {
		console.error("❌ Insert failed with error:", error);
		throw error;
	}

	// Store generated IDs - SELALU fetch dari DB untuk ensure SEMUA product type terisi
	console.log("🔍 Fetching all product types from database...");
	for (const def of productTypeDefinitions) {
		console.log(`  → Looking for: "${def.name}"`);
		const pt = await db.query.productType.findFirst({
			where: (tbl, { eq }) => eq(tbl.name, def.name),
		});
		if (!pt) {
			console.error(`❌ Product type "${def.name}" not found!`);
			const allPts = await db.query.productType.findMany();
			console.error(`Available product types in DB:`, allPts.map((p) => p.name).join(", "));
			throw new Error(`Product type "${def.name}" not found in database after insert attempt.`);
		}
		_productTypeIds[def.key] = pt.id;
		console.log(`  ✓ Found with ID: ${pt.id}`);
	}

	console.log(`✅ Seeded ${inserted.length || productTypeDefinitions.length} product types, all ${Object.keys(_productTypeIds).length} fetched successfully`);
}
