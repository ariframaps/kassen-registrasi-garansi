import { db } from "@/db";
import { productCategories } from "@/db/schemas/product_categories.schema";
import { randomUUID } from "crypto";

export const seedProductCategories = async () => {
	const entries = [
		"barcode printer",
		"bill counter",
		"cash drawer",
		"handheld marking system",
		"mobile printer",
		"portable data terminal",
		"pos system",
		"receipt printer",
		"rfid system",
		"scanner",
		"supplies",
	];

	const values = entries.map((name) => ({
		id: randomUUID(),
		name,
	}));

	await db.insert(productCategories).values(values);

	const map = Object.fromEntries(values.map((v) => [v.name, v.id]));
	return map;
};
