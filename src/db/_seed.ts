// seeds
// import { seedUsers } from "./seeds/users.seed";
// import { seedDealers } from "./seeds/dealers.seed";
// import { seedCustomers } from "./seeds/customers.seed";

// import { seedProductCategories } from "./seeds/product_categories.seed";
// import { seedProductTypes } from "./seeds/product_types.seed";
// import { seedItemCodeMappings } from "./seeds/item_code_mappings.seed";

// import { seedDeliveryOrders } from "./seeds/delivery_orders.seed";
// import { seedProducts } from "./seeds/products.seed";

// import { seedPurchases } from "./seeds/purchases.seed";
// import { seedPurchaseItems } from "./seeds/purchase_items.seed";

// import { seedInvoices } from "./seeds/invoices.seed";
// import { seedWarrantyConditions } from "./seeds/warranty_conditions.seed";

// import { seedWaitingList } from "./seeds/waiting_list.seed";
// import { seedNotifications } from "./seeds/notifications.seed";

// import { seedAuditLogs } from "./seeds/audit_logs.seed";

async function runSeed() {
	try {
		console.log("🌱 Starting seed...");

		// // =========================
		// // 1. CORE USERS
		// // =========================
		// const users = await seedUsers();

		// // =========================
		// // 2. DEALERS (depends on users)
		// // =========================
		// const dealerIds = await seedDealers(users.dealerIds);

		// // =========================
		// // 3. CUSTOMERS
		// // =========================
		// const customerIds = await seedCustomers();

		// // =========================
		// // 4. PRODUCT MASTER DATA
		// // =========================
		// const categories = await seedProductCategories();

		// const productTypes = await seedProductTypes(categories);

		// seedItemCodeMappings(productTypes);

		// // =========================
		// // 5. DELIVERY ORDERS + PRODUCTS
		// // =========================
		// const deliveryOrdersIds = await seedDeliveryOrders({
		// 	userId: users.adminId,
		// 	dealerIds: dealerIds,
		// 	customerIds: customerIds,
		// });

		// const productIds = await seedProducts({
		// 	doIds: deliveryOrdersIds,
		// 	productTypeMap: productTypes,
		// 	dealerIds: dealerIds,
		// });

		// // =========================
		// // 6. TRANSACTIONS
		// // =========================
		// const purchaseIds = await seedPurchases({
		// 	customerIds: customerIds,
		// 	dealerIds: dealerIds,
		// 	userId: users.adminId,
		// });

		// await seedPurchaseItems({
		// 	purchaseIds: purchaseIds,
		// 	productIds: productIds,
		// });

		// // =========================
		// // 7. POST TRANSACTION DATA
		// // =========================
		// await seedInvoices({
		// 	purchaseIds: purchaseIds,
		// 	userId: users.adminId,
		// });

		// await seedWarrantyConditions({
		// 	productIds: productIds,
		// 	userId: users.adminId,
		// });

		// // =========================
		// // 8. EXCEPTION FLOW
		// // =========================
		// const waitingListIds = await seedWaitingList({
		// 	dealerIds: dealerIds,
		// 	userId: users.adminId,
		// 	productIds: productIds,
		// });

		// await seedNotifications({
		// 	userIds: users.allUserIds,
		// 	waitingListIds: waitingListIds,
		// });

		// // =========================
		// // 9. AUDIT LOGS (GLOBAL)
		// // =========================
		// await seedAuditLogs({
		// 	userIds: users.allUserIds,
		// });

		console.log("✅ Seed completed successfully!");
		process.exit(0);
	} catch (err) {
		console.error("❌ Seed failed:", err);
		process.exit(1);
	}
}

// runSeed();
