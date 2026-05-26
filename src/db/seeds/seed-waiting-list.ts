import { db } from "../";
import { waitingList } from "../schemas/waiting_list.schema";
import { DEALER_IDS } from "./seed-dealers";
import { USER_IDS } from "./seed-users";

function pad(n: number): string {
	return String(n).padStart(3, "0");
}

export async function seedWaitingList() {
	console.log("🌱 Seeding waiting list...");

	const now = new Date();
	const notifiedAt = new Date("2024-10-01T10:00:00Z");
	const resolvedAt = new Date("2024-10-05T14:00:00Z");

	const waitingListData: (typeof waitingList.$inferInsert)[] = [
		// End user requests (pending)
		{
			id: `wl_${pad(1)}`,
			serialNumberRequested: "SN-ELECTRICD-00042",
			requesterType: "end_user" as const,
			requesterName: "Agus Setiawan",
			requesterEmail: "agus.setiawan@gmail.com",
			requesterPhone: "0812-1111-2222",
			dealerId: null,
			productId: null,
			status: "pending" as const,
			notifiedAt: null,
			resolvedAt: null,
			notifiedBy: null,
			createdAt: new Date("2024-09-10"),
		},
		{
			id: `wl_${pad(2)}`,
			serialNumberRequested: "SN-CIRCULARSA-00015",
			requesterType: "end_user" as const,
			requesterName: "Maya Indah Sari",
			requesterEmail: "maya.indah@mail.com",
			requesterPhone: "0856-3333-4444",
			dealerId: null,
			productId: null,
			status: "pending" as const,
			notifiedAt: null,
			resolvedAt: null,
			notifiedBy: null,
			createdAt: new Date("2024-09-15"),
		},
		{
			id: `wl_${pad(3)}`,
			serialNumberRequested: "SN-ROTARYHA-00007",
			requesterType: "end_user" as const,
			requesterName: "Farid Hasan",
			requesterEmail: "farid.hasan@personal.id",
			requesterPhone: "0821-5555-6666",
			dealerId: null,
			productId: null,
			status: "pending" as const,
			notifiedAt: null,
			resolvedAt: null,
			notifiedBy: null,
			createdAt: new Date("2024-10-02"),
		},
		{
			id: `wl_${pad(4)}`,
			serialNumberRequested: "SN-IMPACTDR-00019",
			requesterType: "end_user" as const,
			requesterName: "Nina Puspita",
			requesterEmail: "nina.puspita@example.com",
			requesterPhone: null,
			dealerId: null,
			productId: null,
			status: "pending" as const,
			notifiedAt: null,
			resolvedAt: null,
			notifiedBy: null,
			createdAt: new Date("2024-10-20"),
		},
		{
			id: `wl_${pad(5)}`,
			serialNumberRequested: "SN-CHAINSAWE-00003",
			requesterType: "end_user" as const,
			requesterName: "Hadi Susanto",
			requesterEmail: "hadi.susanto@kerja.co.id",
			requesterPhone: "0831-7777-8888",
			dealerId: null,
			productId: null,
			status: "pending" as const,
			notifiedAt: null,
			resolvedAt: null,
			notifiedBy: null,
			createdAt: new Date("2024-11-01"),
		},
		// Dealer requests (pending)
		{
			id: `wl_${pad(6)}`,
			serialNumberRequested: "SN-JIGSAWS-00026",
			requesterType: "dealer" as const,
			requesterName: "Dealer Pratama Tools",
			requesterEmail: "hendra@dealerpratama.com",
			requesterPhone: "021-33445566",
			dealerId: DEALER_IDS.pratama,
			productId: null,
			status: "pending" as const,
			notifiedAt: null,
			resolvedAt: null,
			notifiedBy: null,
			createdAt: new Date("2024-09-20"),
		},
		{
			id: `wl_${pad(7)}`,
			serialNumberRequested: "SN-ELECTRICL-00031",
			requesterType: "dealer" as const,
			requesterName: "Dealer Maju Teknik",
			requesterEmail: "siti@dealermaju.com",
			requesterPhone: "031-77889900",
			dealerId: DEALER_IDS.maju,
			productId: null,
			status: "pending" as const,
			notifiedAt: null,
			resolvedAt: null,
			notifiedBy: null,
			createdAt: new Date("2024-10-10"),
		},
		{
			id: `wl_${pad(8)}`,
			serialNumberRequested: "SN-LEAFBLOW-00044",
			requesterType: "dealer" as const,
			requesterName: "Dealer Sakti Jaya",
			requesterEmail: "rizky@dealersakti.com",
			requesterPhone: "022-55667788",
			dealerId: DEALER_IDS.sakti,
			productId: null,
			status: "pending" as const,
			notifiedAt: null,
			resolvedAt: null,
			notifiedBy: null,
			createdAt: new Date("2024-11-05"),
		},
		// Notified entries (resolved)
		{
			id: `wl_${pad(9)}`,
			serialNumberRequested: "SN-ANGLEGRI-00012",
			requesterType: "end_user" as const,
			requesterName: "Rina Anggraeni",
			requesterEmail: "rina.anggraeni@work.com",
			requesterPhone: "0878-9999-0000",
			dealerId: null,
			productId: null,
			status: "notified" as const,
			notifiedAt,
			resolvedAt,
			notifiedBy: USER_IDS.sales1,
			createdAt: new Date("2024-09-01"),
		},
		{
			id: `wl_${pad(10)}`,
			serialNumberRequested: "SN-RANDOMOR-00038",
			requesterType: "dealer" as const,
			requesterName: "Dealer Pratama Tools",
			requesterEmail: "hendra@dealerpratama.com",
			requesterPhone: "021-33445566",
			dealerId: DEALER_IDS.pratama,
			productId: null,
			status: "notified" as const,
			notifiedAt,
			resolvedAt,
			notifiedBy: USER_IDS.sales2,
			createdAt: new Date("2024-08-28"),
		},
	];

	await db.insert(waitingList).values(waitingListData).onConflictDoNothing();
	console.log(`✅ Seeded ${waitingListData.length} waiting list entries`);

	return waitingListData.map((w) => w.id as string);
}
