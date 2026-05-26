import { db } from "../";
import { purchase } from "../schemas/purchase.schema";
import { purchaseItem } from "../schemas/purchase_item.schema";
import { invoice } from "../schemas/invoice.schema";
import { USER_IDS } from "./seed-users";
import { DEALER_IDS } from "./seed-dealers";
import { CUSTOMER_IDS } from "./seed-customers";
import { ASSIGNED_PRODUCT_IDS, WARRANTY_PRODUCT_IDS } from "./seed-products";

function pad(n: number): string {
	return String(n).padStart(3, "0");
}

export const PURCHASE_IDS: string[] = [];

export async function seedPurchasesAndInvoices() {
	console.log("🌱 Seeding 25 purchases with items and invoices...");

	const now = new Date();

	// We have 25 assigned + 35 warranty_active products = 60 available products for purchase
	// We'll seed exactly 25 purchases, each with 1-3 items
	// Use 60 products total — split between assigned and warranty_active
	const allPurchasableProducts = [
		...ASSIGNED_PRODUCT_IDS,
		...WARRANTY_PRODUCT_IDS,
	];

	// Source mix: 15 dealer, 10 direct_sales
	const purchaseSources: Array<"dealer" | "direct_sales"> = [
		...Array(15).fill("dealer"),
		...Array(10).fill("direct_sales"),
	];

	const registeredByUsers = [USER_IDS.sales1, USER_IDS.sales2, USER_IDS.admin];
	const dealerList = [DEALER_IDS.pratama, DEALER_IDS.maju, DEALER_IDS.sakti];

	const purchaseDates = [
		"2024-01-20",
		"2024-02-05",
		"2024-02-18",
		"2024-03-03",
		"2024-03-15",
		"2024-03-28",
		"2024-04-10",
		"2024-04-22",
		"2024-05-05",
		"2024-05-14",
		"2024-05-25",
		"2024-06-03",
		"2024-06-18",
		"2024-07-01",
		"2024-07-15",
		"2024-07-28",
		"2024-08-05",
		"2024-08-18",
		"2024-09-02",
		"2024-09-14",
		"2024-09-25",
		"2024-10-07",
		"2024-10-21",
		"2024-11-04",
		"2024-11-18",
	];

	const purchaseNotes = [
		"Pembelian untuk kebutuhan proyek konstruksi",
		"Order rutin bulanan",
		null,
		"Penggantian unit lama",
		"Pembelian alat baru untuk tim lapangan",
		null,
		"Order khusus pelanggan korporat",
		"Pembelian bulk untuk tender pemerintah",
		null,
		"Repeat order dari pelanggan setia",
		"Pembelian untuk stok gudang",
		null,
		"Pengadaan alat kerja baru",
		"Order mendesak untuk proyek",
		null,
	];

	const purchases: (typeof purchase.$inferInsert)[] = [];
	const purchaseItems: (typeof purchaseItem.$inferInsert)[] = [];
	const invoices: (typeof invoice.$inferInsert)[] = [];

	let productIndex = 0;

	for (let i = 0; i < 25; i++) {
		const purchaseId = `purch_${pad(i + 1)}`;
		PURCHASE_IDS.push(purchaseId);

		const source = purchaseSources[i];
		const dealerId =
			source === "dealer" ? dealerList[i % dealerList.length] : null;
		const customerId = CUSTOMER_IDS[i % CUSTOMER_IDS.length];
		const registeredBy = registeredByUsers[i % registeredByUsers.length];

		purchases.push({
			id: purchaseId,
			purchaseDate: purchaseDates[i],
			customerId,
			dealerId,
			registeredBy,
			source,
			notes: purchaseNotes[i % purchaseNotes.length],
			createdAt: new Date(purchaseDates[i]),
			updatedAt: new Date(purchaseDates[i]),
		});

		// Each purchase gets 1–3 items (cycle pattern: 1,2,3,1,2,3...)
		const itemCount = (i % 3) + 1;

		for (let j = 0; j < itemCount; j++) {
			if (productIndex >= allPurchasableProducts.length) break;

			const productId = allPurchasableProducts[productIndex++];

			purchaseItems.push({
				id: `pi_${pad(i + 1)}_${j + 1}`,
				purchaseId,
				productId,
				createdAt: new Date(purchaseDates[i]),
			});
		}

		// Attach an invoice to each of the 25 purchases
		const mimeTypes = ["application/pdf", "image/jpeg", "image/png"];
		const fileSizes = [102400, 204800, 512000, 1048576, 2097152];

		invoices.push({
			id: `inv_${pad(i + 1)}`,
			purchaseId,
			storagePath: `invoices/2024/${purchaseId}/invoice_${pad(i + 1)}.pdf`,
			originalFilename: `Invoice_${purchaseId.toUpperCase()}.pdf`,
			mimeType: mimeTypes[i % mimeTypes.length],
			fileSizeBytes: fileSizes[i % fileSizes.length],
			uploadedBy: registeredBy,
			createdAt: new Date(purchaseDates[i]),
			updatedAt: new Date(purchaseDates[i]),
		});
	}

	await db.insert(purchase).values(purchases).onConflictDoNothing();
	console.log(`  ✓ Inserted ${purchases.length} purchases`);

	await db.insert(purchaseItem).values(purchaseItems).onConflictDoNothing();
	console.log(`  ✓ Inserted ${purchaseItems.length} purchase items`);

	await db.insert(invoice).values(invoices).onConflictDoNothing();
	console.log(`  ✓ Inserted ${invoices.length} invoices`);

	console.log("✅ Seeded purchases, purchase items, and invoices");
}
