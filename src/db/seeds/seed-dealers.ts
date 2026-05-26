import { db } from "../";
import { dealers } from "../schemas/dealer.schema";
import { USER_IDS } from "./seed-users";

export const DEALER_IDS = {
	pratama: "dealer_001",
	maju: "dealer_002",
	sakti: "dealer_003",
	cahaya: "dealer_004",
};

export async function seedDealers() {
	console.log("🌱 Seeding dealers...");

	const now = new Date();

	const dealerData = [
		{
			id: DEALER_IDS.pratama,
			userId: USER_IDS.dealer1,
			name: "Dealer Pratama Tools",
			email: "hendra@dealerpratama.com",
			phone: "021-33445566",
			address: "Jl. Industri Raya Blok C No. 5, Cikarang, Bekasi, Jawa Barat",
			status: "active" as const,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: DEALER_IDS.maju,
			userId: USER_IDS.dealer2,
			name: "Dealer Maju Teknik",
			email: "siti@dealermaju.com",
			phone: "031-77889900",
			address: "Jl. Raya Waru No. 120, Sidoarjo, Jawa Timur",
			status: "active" as const,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: DEALER_IDS.sakti,
			userId: USER_IDS.dealer3,
			name: "Dealer Sakti Jaya",
			email: "rizky@dealersakti.com",
			phone: "022-55667788",
			address: "Jl. Gatot Subroto No. 200, Bandung, Jawa Barat",
			status: "active" as const,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: DEALER_IDS.cahaya,
			userId: USER_IDS.dealer4,
			name: "Dealer Cahaya Abadi",
			email: "tanya@dealercahaya.com",
			phone: "024-11223344",
			address: "Jl. Pemuda No. 99, Semarang, Jawa Tengah",
			status: "inactive" as const,
			createdAt: now,
			updatedAt: now,
		},
	];

	await db.insert(dealers).values(dealerData).onConflictDoNothing();
	console.log(`✅ Seeded ${dealerData.length} dealers`);
}
