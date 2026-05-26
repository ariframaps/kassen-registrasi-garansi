import { createHash } from "crypto";
import { db } from "../";
import { user, account } from "../schemas/auth-schema";

export const USER_IDS = {
	admin: "user_admin_001",
	sales1: "user_sales_001",
	sales2: "user_sales_002",
	dealer1: "user_dealer_001",
	dealer2: "user_dealer_002",
	dealer3: "user_dealer_003",
	dealer4: "user_dealer_004",
	techSupport1: "user_tech_001",
	techSupport2: "user_tech_002",
};

export async function seedUsers() {
	console.log("🌱 Seeding users...");

	const passwordHash = createHash("sha256")
		.update("Password123!", "utf-8")
		.digest("hex");
	const now = new Date();

	const users = [
		{
			id: USER_IDS.admin,
			name: "Admin Utama",
			email: "admin@company.com",
			emailVerified: true,
			role: "admin" as const,
			status: "active" as const,
			createdAt: now,
			updatedAt: now,
			lastLoginAt: now,
		},
		{
			id: USER_IDS.sales1,
			name: "Budi Santoso",
			email: "budi.santoso@company.com",
			emailVerified: true,
			role: "sales" as const,
			status: "active" as const,
			createdAt: now,
			updatedAt: now,
			lastLoginAt: now,
		},
		{
			id: USER_IDS.sales2,
			name: "Dewi Rahayu",
			email: "dewi.rahayu@company.com",
			emailVerified: true,
			role: "sales" as const,
			status: "active" as const,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: USER_IDS.dealer1,
			name: "Hendra Wijaya",
			email: "hendra@dealerpratama.com",
			emailVerified: true,
			role: "dealer" as const,
			status: "active" as const,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: USER_IDS.dealer2,
			name: "Siti Nurhaliza",
			email: "siti@dealermaju.com",
			emailVerified: true,
			role: "dealer" as const,
			status: "active" as const,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: USER_IDS.dealer3,
			name: "Rizky Firmansyah",
			email: "rizky@dealersakti.com",
			emailVerified: true,
			role: "dealer" as const,
			status: "active" as const,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: USER_IDS.dealer4,
			name: "Tanya Kusuma",
			email: "tanya@dealercahaya.com",
			emailVerified: false,
			role: "dealer" as const,
			status: "inactive" as const,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: USER_IDS.techSupport1,
			name: "Ahmad Fauzi",
			email: "ahmad.fauzi@company.com",
			emailVerified: true,
			role: "technical_support" as const,
			status: "active" as const,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: USER_IDS.techSupport2,
			name: "Lina Marlina",
			email: "lina.marlina@company.com",
			emailVerified: true,
			role: "technical_support" as const,
			status: "active" as const,
			createdAt: now,
			updatedAt: now,
		},
	];

	await db.insert(user).values(users).onConflictDoNothing();

	// Insert credential accounts for each user
	const accounts = users.map((u) => ({
		id: `acc_${u.id}`,
		accountId: u.email,
		providerId: "credential",
		userId: u.id,
		password: passwordHash,
		createdAt: now,
		updatedAt: now,
	}));

	await db.insert(account).values(accounts).onConflictDoNothing();

	console.log(`✅ Seeded ${users.length} users`);
}
