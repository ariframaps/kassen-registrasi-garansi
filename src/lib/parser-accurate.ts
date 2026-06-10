import * as XLSX from "xlsx";
import { normalizeSerialNumber } from "@/lib/utils";

// ==========================================
// INTERFACES (Dipertahankan sesuai Claude)
// ==========================================
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

export interface PreviewRow {
	serialNumber: string;
	productType: string;
	productCategory: string;
	itemCodeOriginal?: string;
	status: "valid" | "duplicate" | "invalid" | "unknown_type";
	message?: string;
}

// ==========================================
// HELPER FUNCTIONS (Logika Asli Dikembalikan)
// ==========================================
function lastTextCell(row: any[]): string {
	for (let i = row.length - 1; i >= 0; i--) {
		const v = String(row[i] ?? "").trim();
		if (v) return v;
	}
	return "";
}

// Kembalikan fungsi pengecekan kolom kanan khusus SN dari kode asli
function extractAndPushSerials(
	row: any[],
	currentItem: ParsedItem | null,
	regex: RegExp,
) {
	if (!currentItem) return;

	let serialRaw = "";

	// DIKEMBALIKAN: Scan dari paling kanan maksimal sampai indeks 25 (setelah kolom Unit)
	for (let i = row.length - 1; i > 24; i--) {
		const val = String(row[i] ?? "").trim();
		if (val) {
			serialRaw = val;
			break;
		}
	}

	if (!serialRaw) return;

	// DIKEMBALIKAN: Pecah dan validasi ketat menggunakan Regex asli
	const parts = serialRaw
		.split(",")
		.map((s) => s.trim())
		.filter((s) => regex.test(s));

	currentItem.serialNumbers.push(...parts);
}

// ==========================================
// MAIN PARSING LOGIC
// ==========================================
function parseItemsGlobal(rows: any[][]): ParsedItem[] {
	const items: ParsedItem[] = [];
	let currentItem: ParsedItem | null = null;
	let inItemSection = false;

	// DIKEMBALIKAN: Regex wajib kombinasi Huruf Besar DAN Angka (Min 8 karakter)
	const serialNumberRegex = /^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{8,}$/;

	for (let j = 0; j < rows.length; j++) {
		const r = rows[j];
		const c1 = String(r[1] ?? "").trim();

		// 1. Deteksi Header Tabel Utama / Berulang
		if (c1 === "Item Code" || c1 === "Description") {
			inItemSection = true;
			continue;
		}
		if (!inItemSection) continue;

		// 2. DIKEMBALIKAN: Filter Baris Hiasan / Syarat Pembayaran / Footer
		if (
			c1.length > 30 ||
			c1.includes(" ") ||
			c1.startsWith("SO Number") ||
			c1.startsWith("SO Date")
		) {
			// Walaupun baris hiasan, tetap cek jika ada SN murni yang sejajar di kanan
			extractAndPushSerials(r, currentItem, serialNumberRegex);
			continue;
		}

		const itemCode = c1;
		const desc = String(r[7] ?? "").trim();
		const qtyVal = Number(r[18]) || 0;
		const unit = String(r[24] ?? "").trim();

		// 3. Jika ini baris item code valid, buat objek item baru
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

		// 4. DIKEMBALIKAN: Ekstrak Serial Number dengan filter regex & batasan kolom
		extractAndPushSerials(r, currentItem, serialNumberRegex);
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

		if (afterShipMetaRow >= 0) {
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
			break;
		}
	}

	// DIKEMBALIKAN: Panggil fungsi global yang sudah dipulihkan logikanya
	const items = parseItemsGlobal(rows);

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

// ==========================================
// EXPORTED FUNCTIONS (Dipertahankan sesuai Claude)
// ==========================================
export async function parseExcelFile(file: File): Promise<ParsedDeliveryOrder> {
	const buffer = Buffer.from(await file.arrayBuffer());
	const workbook = XLSX.read(buffer, { type: "buffer" });

	const sheetName = workbook.SheetNames[0];
	const sheet = workbook.Sheets[sheetName];

	const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
		header: 1,
		defval: "",
	});

	return parseDeliveryOrder(rows);
}

export function validateAndPreview(
	parsed: ParsedDeliveryOrder,
	existingSerialNumbers: Set<string>,
	productTypeMap: Map<string, { id: string; category: string; name: string }>,
): {
	preview: PreviewRow[];
	validCount: number;
	dupCount: number;
	unknownCount: number;
} {
	const preview: PreviewRow[] = [];
	let validCount = 0;
	let dupCount = 0;
	let unknownCount = 0;

	for (const item of parsed.items) {
		for (const sn of item.serialNumbers) {
			const normalized = normalizeSerialNumber(sn);

			if (existingSerialNumbers.has(normalized)) {
				preview.push({
					serialNumber: normalized,
					productType: "",
					productCategory: "",
					itemCodeOriginal: item.itemCode,
					status: "duplicate",
					message: "SN sudah ada di sistem",
				});
				dupCount++;
			} else {
				const mapping = productTypeMap.get(item.itemCode);

				if (mapping) {
					preview.push({
						serialNumber: normalized,
						productType: mapping.name,
						productCategory: mapping.category,
						status: "valid",
					});
					validCount++;
				} else {
					preview.push({
						serialNumber: normalized,
						productType: "",
						productCategory: "",
						itemCodeOriginal: item.itemCode,
						status: "unknown_type",
						message: `Item code '${item.itemCode}' belum ada mapping`,
					});
					unknownCount++;
				}
			}
		}
	}

	return {
		preview,
		validCount,
		dupCount,
		unknownCount,
	};
}
