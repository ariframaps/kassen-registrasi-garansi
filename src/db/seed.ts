/**
 * seed.ts — Main seed runner
 *
 * Run with:
 *   npx tsx seed.ts
 *   or
 *   npx ts-node seed.ts
 *
 * Tables seeded (in dependency order):
 *  1. users + accounts           (no deps)
 *  2. product_category           (no deps)
 *  3. product_type               (→ product_category)
 *  4. item_code_mapping          (→ product_type)
 *  5. customer                   (no deps)
 *  6. dealer                     (→ user)
 *  7. delivery_order             (→ user, dealer, customer)
 *  8. product                    (→ product_type, delivery_order, dealer)
 *  9. purchase                   (→ customer, dealer, user)
 * 10. purchase_item              (→ purchase, product)
 * 11. invoice                    (→ purchase, user)
 * 12. warranty_condition         (→ product, user)
 * 13. waiting_list               (→ dealer, product, user)
 * 14. notification               (→ user, waiting_list)
 * 15. audit_log                  (→ user)
 */

import { seedUsers } from "./seeds/seed-users";
import {
	seedProductCategories,
	seedProductTypes,
} from "./seeds/seed-product-categories";
import { seedItemCodeMappings } from "./seeds/seed-item-codes";
import { seedCustomers } from "./seeds/seed-customers";
import { seedDealers } from "./seeds/seed-dealers";
import { seedDeliveryOrders } from "./seeds/seed-delivery-orders";
import { seedProducts } from "./seeds/seed-products";
import { seedPurchasesAndInvoices } from "./seeds/seed-purchases";
import { seedWarrantyConditions } from "./seeds/seed-warranty";
import { seedWaitingList } from "./seeds/seed-waiting-list";
import { seedNotifications } from "./seeds/seed-notifications";
import { seedAuditLogs } from "./seeds/seed-audit-logs";

async function main() {
	console.log("\n🚀 Starting database seed...\n");
	console.log("=".repeat(50));

	try {
		// ── Tier 1: No dependencies ──────────────────────────
		await seedUsers();
		await seedProductCategories();
		await seedCustomers();

		// ── Tier 2: Depends on Tier 1 ────────────────────────
		await seedProductTypes();
		await seedDealers();

		// ── Tier 3: Depends on Tier 2 ────────────────────────
		await seedItemCodeMappings();
		await seedDeliveryOrders();

		// ── Tier 4: Depends on Tier 3 ────────────────────────
		await seedProducts();

		// ── Tier 5: Depends on Tier 4 ────────────────────────
		// seedPurchasesAndInvoices inserts purchase, purchase_item, AND invoice
		await seedPurchasesAndInvoices();
		await seedWarrantyConditions();

		// ── Tier 6: Depends on Tier 5 ────────────────────────
		const waitingListIds = await seedWaitingList();
		await seedNotifications(waitingListIds);
		await seedAuditLogs();

		console.log("\n" + "=".repeat(50));
		console.log("✅ All seeds completed successfully!\n");
		console.log("Summary:");
		console.log("  • 9    users (admin, sales×2, dealer×4, tech_support×2)");
		console.log("  • 5    product categories");
		console.log("  • 23   product types (covers all categories)");
		console.log("  • 23   item code mappings");
		console.log("  • 15   customers");
		console.log("  • 4    dealers (3 active, 1 inactive)");
		console.log("  • 12   delivery orders (dealer + customer destinations)");
		console.log(
			"  • 100  products (unassigned/assigned/warranty_active/warranty_expired)",
		);
		console.log("  • 25   purchases (dealer + direct_sales sources)");
		console.log("  • ~42  purchase items");
		console.log("  • 25   invoices");
		console.log("  • 45   warranty conditions (valid + rejected)");
		console.log("  • 10   waiting list entries (pending + notified)");
		console.log("  • 10   notifications (product_ready + general)");
		console.log("  • 22   audit logs (all categories, statuses, priorities)");
		console.log("");
		process.exit(1);
	} catch (error) {
		console.error("\n❌ Seed failed:", error);
		process.exit(1);
	}
}

main();
