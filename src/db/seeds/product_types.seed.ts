import { db } from "@/db";
import { productTypes } from "@/db/schemas/product_types.schema";
import { randomUUID } from "crypto";

export const seedProductTypes = async (categoryIds: Record<string, string>) => {
	const entries = [
		{
			key: "barcode printer",
			name: "Barcode Printer Standard",
			warranty: 12,
		},
		{
			key: "bill counter",
			name: "Bill Counter Basic",
			warranty: 12,
		},
		{
			key: "cash drawer",
			name: "Cash Drawer Standard",
			warranty: 12,
		},
		{
			key: "handheld marking system",
			name: "Handheld Marking Pro",
			warranty: 12,
		},
		{
			key: "mobile printer",
			name: "Mobile Printer Mini",
			warranty: 12,
		},
		{
			key: "portable data terminal",
			name: "PDT Industrial",
			warranty: 12,
		},
		{
			key: "pos system",
			name: "POS System Standard",
			warranty: 12,
		},
		{
			key: "receipt printer",
			name: "Receipt Printer Thermal",
			warranty: 12,
		},
		{
			key: "rfid system",
			name: "RFID System Basic",
			warranty: 12,
		},
		{
			key: "scanner",
			name: "Barcode Scanner Laser",
			warranty: 12,
		},
		{
			key: "supplies",
			name: "Consumable Supplies",
			warranty: 0,
		},
	];

	const rows = entries.map((e) => ({
		id: randomUUID(),
		categoryId: categoryIds[e.key],
		name: e.name,
		warrantyDurationMonths: e.warranty,
	}));

	await db.insert(productTypes).values(rows);

	return Object.fromEntries(rows.map((r, i) => [entries[i].key, r.id]));
};
