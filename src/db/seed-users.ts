/**
 * seed-users.ts — Seeds ONLY the users + accounts tables.
 *
 * Use this instead of `db:seed` when you don't want to touch
 * products/product-types/item-codes/categories (e.g. against a database
 * that already has real product data).
 *
 * Run with:
 *   npm run db:seed:users
 */

import { seedUsers } from "./seeds/seed-users";

async function main() {
	console.log("\n🚀 Seeding users...\n");

	try {
		await seedUsers();
		console.log("\n✅ Users seeded successfully!\n");
		process.exit(0);
	} catch (error) {
		console.error("\n❌ Seed failed:", error);
		process.exit(1);
	}
}

main();
