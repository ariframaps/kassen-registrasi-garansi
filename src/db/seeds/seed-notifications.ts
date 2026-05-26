import { db } from "../";
import { notification } from "../schemas/notification.schema";
import { USER_IDS } from "./seed-users";

function pad(n: number): string {
	return String(n).padStart(3, "0");
}

export async function seedNotifications(waitingListIds: string[]) {
	console.log("🌱 Seeding notifications...");

	const targetUserIds = [
		USER_IDS.dealer1,
		USER_IDS.dealer2,
		USER_IDS.dealer3,
		USER_IDS.sales1,
		USER_IDS.admin,
	];

	const notifications: (typeof notification.$inferInsert)[] = [
		// product_ready notifications (linked to waiting list)
		{
			id: `notif_${pad(1)}`,
			userId: USER_IDS.dealer1,
			title: "Produk Siap",
			body: "Serial number SN-ANGLEGRI-00012 yang Anda daftarkan sudah tersedia. Silakan hubungi kami untuk proses selanjutnya.",
			type: "product_ready" as const,
			relatedWaitingListId: waitingListIds[8] ?? null, // wl_009 (notified)
			isRead: true,
			createdAt: new Date("2024-10-01T10:05:00Z"),
		},
		{
			id: `notif_${pad(2)}`,
			userId: USER_IDS.dealer1,
			title: "Produk Siap - Random Orbital Sander",
			body: "Produk SN-RANDOMOR-00038 sudah tersedia di stok kami. Segera konfirmasi pengambilan.",
			type: "product_ready" as const,
			relatedWaitingListId: waitingListIds[9] ?? null, // wl_010 (notified)
			isRead: false,
			createdAt: new Date("2024-10-01T10:10:00Z"),
		},
		// General notifications for admin
		{
			id: `notif_${pad(3)}`,
			userId: USER_IDS.admin,
			title: "Dealer Baru Mendaftar",
			body: "Dealer Cahaya Abadi (tanya@dealercahaya.com) telah mendaftar dan menunggu verifikasi.",
			type: "general" as const,
			relatedWaitingListId: null,
			isRead: true,
			createdAt: new Date("2024-03-20T08:00:00Z"),
		},
		{
			id: `notif_${pad(4)}`,
			userId: USER_IDS.admin,
			title: "Laporan Stok Rendah",
			body: "Beberapa kategori produk memiliki stok yang rendah. Harap lakukan pemesanan ulang segera.",
			type: "general" as const,
			relatedWaitingListId: null,
			isRead: false,
			createdAt: new Date("2024-11-10T09:30:00Z"),
		},
		{
			id: `notif_${pad(5)}`,
			userId: USER_IDS.sales1,
			title: "Target Penjualan Tercapai",
			body: "Selamat! Target penjualan bulan Oktober telah tercapai 110%. Luar biasa!",
			type: "general" as const,
			relatedWaitingListId: null,
			isRead: true,
			createdAt: new Date("2024-11-01T07:00:00Z"),
		},
		{
			id: `notif_${pad(6)}`,
			userId: USER_IDS.sales2,
			title: "Permintaan Waiting List Baru",
			body: "Terdapat 3 permintaan waiting list baru yang perlu ditindaklanjuti.",
			type: "general" as const,
			relatedWaitingListId: null,
			isRead: false,
			createdAt: new Date("2024-11-05T11:00:00Z"),
		},
		{
			id: `notif_${pad(7)}`,
			userId: USER_IDS.dealer2,
			title: "Invoice Pembelian Tersedia",
			body: "Invoice untuk pembelian terakhir Anda sudah dapat diunduh melalui portal dealer.",
			type: "general" as const,
			relatedWaitingListId: null,
			isRead: false,
			createdAt: new Date("2024-10-22T14:00:00Z"),
		},
		{
			id: `notif_${pad(8)}`,
			userId: USER_IDS.dealer3,
			title: "Pengiriman Sedang Diproses",
			body: "Delivery order DO/2024/006 sedang dalam proses pengiriman. Estimasi tiba 3-5 hari kerja.",
			type: "general" as const,
			relatedWaitingListId: null,
			isRead: true,
			createdAt: new Date("2024-04-03T10:00:00Z"),
		},
		{
			id: `notif_${pad(9)}`,
			userId: USER_IDS.admin,
			title: "Garansi Produk Ditolak",
			body: "Terdapat 5 klaim garansi yang ditolak karena tidak memenuhi syarat. Silakan cek detail di menu warranty.",
			type: "general" as const,
			relatedWaitingListId: null,
			isRead: false,
			createdAt: new Date("2024-11-12T16:00:00Z"),
		},
		{
			id: `notif_${pad(10)}`,
			userId: USER_IDS.techSupport1,
			title: "Tugas Verifikasi Garansi Baru",
			body: "Ada 10 produk baru yang memerlukan verifikasi kondisi garansi. Mohon segera ditindaklanjuti.",
			type: "general" as const,
			relatedWaitingListId: null,
			isRead: false,
			createdAt: new Date("2024-11-15T08:00:00Z"),
		},
	];

	await db.insert(notification).values(notifications).onConflictDoNothing();
	console.log(`✅ Seeded ${notifications.length} notifications`);
}
