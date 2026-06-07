// Client-side Excel parser for Accurate format
// Uses the same parsing logic as backend but runs in browser

import * as XLSX from "xlsx";

export interface ParsedItem {
	itemCode: string;
	itemDescription: string;
	qty: number;
	unit: string;
	serialNumbers: string[];
}

export interface ParsedDeliveryOrder {
	doNumber: string;
	date: string;
	sentBy: string;
	orderRef: string;
	area: string;
	shipTo: string;
	items: ParsedItem[];
	totalQty: number;
	totalItem: number;
}

function lastTextCell(row: any[]) {
	for (let i = row.length - 1; i >= 0; i--) {
		const v = String(row[i] ?? "").trim();
		if (v) return v;
	}
	return "";
}

function parseItemsGlobal(rows: any[][]) {
	const items: any[] = [];
	let currentItem: any = null;
	let inItemSection = false;

	for (let j = 0; j < rows.length; j++) {
		const r = rows[j];
		const c1 = String(r[1] ?? "").trim();

		if (c1 === "Item Code") {
			inItemSection = true;
			continue;
		}
		if (!inItemSection) continue;

		const itemCode = c1;
		const desc = String(r[7] ?? "").trim();
		const qtyVal = Number(r[18]) || 0;
		const unit = String(r[24] ?? "").trim();
		const serialRaw = lastTextCell(r);
		const hasAnyData = itemCode || desc || qtyVal || unit || serialRaw;

		if (!hasAnyData) continue;

		if (itemCode) {
			currentItem = {
				itemCode,
				itemDescription: desc,
				qty: qtyVal,
				unit,
				serialNumbers: [] as string[],
			};
			items.push(currentItem);
		}

		if (serialRaw && currentItem) {
			const parts = serialRaw
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean);
			currentItem.serialNumbers.push(...parts);
		}
	}

	return items;
}

function parseDeliveryOrder(rows: any[][]): ParsedDeliveryOrder {
	let shipTo = "";
	let doNumber = "";
	let date = "";
	let sentBy = "";
	let orderRef = "";
	let area = "";

	let afterShipMetaRow = -1;
	let items: any[] = [];

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const c1 = String(row[1] ?? "").trim();
		const last = lastTextCell(row);

		if (c1 === "Ship To") {
			const next = rows[i + 1] ?? [];
			shipTo = String(next[1] ?? "").trim();
			doNumber = lastTextCell(next);
			afterShipMetaRow = 0;
			continue;
		}

		if (afterShipMetaRow >= 0 && items.length === 0) {
			if (!last) continue;

			switch (afterShipMetaRow) {
				case 0:
					if (last.match(/\d{1,2} \w+ \d{4}/)) {
						date = last;
					} else {
						break;
					}
					afterShipMetaRow++;
					continue;
				case 1:
					sentBy = last;
					afterShipMetaRow++;
					continue;
				case 2:
					orderRef = last;
					afterShipMetaRow++;
					continue;
				case 3:
					area = last;
					afterShipMetaRow = -1;
					continue;
			}
		}

		if (c1 === "Item Code") {
			items = parseItemsGlobal(rows);
			break;
		}
	}

	return {
		doNumber,
		date,
		sentBy,
		orderRef,
		area,
		shipTo,
		items,
		totalQty: items.reduce((s, it) => s + it.qty, 0),
		totalItem: items.length,
	};
}

export async function parseExcelFileClient(file: File): Promise<ParsedDeliveryOrder> {
	const buffer = await file.arrayBuffer();
	const workbook = XLSX.read(buffer, { type: "buffer" });
	const sheetName = workbook.SheetNames[0];
	const sheet = workbook.Sheets[sheetName];
	const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
		header: 1,
		defval: "",
	});
	return parseDeliveryOrder(rows);
}
