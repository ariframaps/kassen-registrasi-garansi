// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
	const formData = await req.formData();
	const file = formData.get("file") as File;

	const buffer = Buffer.from(await file.arrayBuffer());
	const workbook = XLSX.read(buffer, { type: "buffer" });

	const sheetName = workbook.SheetNames[0];
	const sheet = workbook.Sheets[sheetName];

	const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
		header: 1,
		defval: "",
	});

	const result = parseDeliveryOrder(rows);
	return NextResponse.json(result);
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

		// begitu ketemu header "Item Code", aktifkan mode item
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

		// kalau sudah tidak ada data sama sekali dan currentItem ada,
		// jangan langsung break, lanjut saja; kita hanya break kalau
		// sudah melewati beberapa baris kosong berturut-turut
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

function parseDeliveryOrder(rows: any[][]) {
	let shipTo = "";
	let doNumber = "";
	let date = "";
	let sentBy = "";
	let orderRef = "";
	let area = "";

	let afterShipMetaRow = -1; // -1 = belum mulai baca metadata
	let items: any[] = [];

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const c1 = String(row[1] ?? "").trim();
		const last = lastTextCell(row);

		// Ship To + DO
		if (c1 === "Ship To") {
			const next = rows[i + 1] ?? [];
			shipTo = String(next[1] ?? "").trim();
			doNumber = lastTextCell(next); // DO.xxx
			afterShipMetaRow = 0;
			continue;
		}

		// Metadata berurutan setelah Ship To:
		// 0: tanggal, 1: DIKIRIM MKO, 2: PO / nomor order, 3: area
		if (afterShipMetaRow >= 0 && items.length === 0) {
			if (!last) continue; // skip baris kosong

			switch (afterShipMetaRow) {
				case 0:
					if (last.match(/\d{1,2} \w+ \d{4}/)) {
						date = last;
					} else {
						// kalau baris ini bukan tanggal, jangan maju counter
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
					afterShipMetaRow = -1; // selesai baca metadata
					continue;
			}
		}

		// Header item row
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
