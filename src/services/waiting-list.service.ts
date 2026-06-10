import { db } from "@/db";
import { WaitingListSchema, waitingList, waitingListSchema, product as productTable, notification } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
import { TemplateVariables } from "@/lib/email";

function formatDateString(date?: Date | string | null): string {
	if (!date) return "—";
	const d = new Date(date);
	return d.toLocaleDateString("id-ID", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

export const waitingListService = {
	getAll: async (): Promise<WaitingListSchema[]> => {
		const result = await db.query.waitingList.findMany({});
		const parsed = waitingListSchema.array().parse(result);
		return parsed;
	},

	create: async (data: {
		serialNumberRequested: string;
		requesterType: "end_user" | "dealer";
		requesterName: string;
		requesterEmail: string;
		requesterPhone: string;
		dealerId?: string;
	}): Promise<WaitingListSchema> => {
		const result = await db
			.insert(waitingList)
			.values({
				id: crypto.randomUUID(),
				serialNumberRequested: data.serialNumberRequested,
				requesterType: data.requesterType,
				requesterName: data.requesterName,
				requesterEmail: data.requesterEmail,
				requesterPhone: data.requesterPhone,
				dealerId: data.dealerId || null,
				status: "pending",
			})
			.returning();

		const parsed = waitingListSchema.parse(result[0]);
		return parsed;
	},

	notify: async ({
		id,
		notificationType,
		notifiedBy,
		userId,
	}: {
		id: string;
		notificationType: "check_sn" | "warranty_detail" | "dealer_ready";
		notifiedBy: string;
		userId: string;
	}): Promise<WaitingListSchema> => {
		const entry = await db.query.waitingList.findFirst({
			where: eq(waitingList.id, id),
			with: {
				product: {
					with: {
						productType: {
							with: {
								category: true,
							},
						},
					},
				},
			},
		});

		if (!entry) throw new Error("Waiting list entry not found");

		// If product relation is empty, try to find product by serialNumberRequested
		let productData = entry.product ?? null;
		if (!productData) {
			productData = (await db.query.product.findFirst({
				where: eq(productTable.serialNumber, entry.serialNumberRequested),
				with: {
					productType: {
						with: {
							category: true,
						},
					},
				},
			})) ?? null;
		}

		// Prepare email template variables
		let templateFileName = "";
		const templateVariables: TemplateVariables = {
			requesterName: entry.requesterName || "",
			serialNumber: entry.serialNumberRequested,
		};

		if (notificationType === "check_sn") {
			templateFileName = "waiting-list-notify-check-sn";
		} else if (notificationType === "warranty_detail" && productData) {
			templateFileName = "waiting-list-notify-warranty-detail";
			const p = productData;
			const today = new Date();
			const startDate = p.warrantyStartDate ? new Date(p.warrantyStartDate) : null;
			const endDate = p.warrantyEndDate ? new Date(p.warrantyEndDate) : null;

			let statusIcon = "⏳";
			let statusClass = "status-expired";
			let statusText = "Garansi Belum Aktif";
			let statusDescription = "belum memasuki periode garansi";

			if (startDate && endDate) {
				if (today < startDate) {
					statusIcon = "⏳";
					statusClass = "status-expired";
					statusText = "Garansi Belum Aktif";
					statusDescription = "belum memasuki periode garansi";
				} else if (today > endDate) {
					statusIcon = "❌";
					statusClass = "status-expired";
					statusText = "Garansi Telah Berakhir";
					statusDescription = "telah melampaui masa garansi";
				} else {
					statusIcon = "✅";
					statusClass = "status-active";
					statusText = "Garansi Aktif";
					statusDescription = "masih dalam periode garansi yang valid";
				}
			}

			templateVariables.statusIcon = statusIcon;
			templateVariables.statusClass = statusClass;
			templateVariables.statusText = statusText;
			templateVariables.statusDescription = statusDescription;
			templateVariables.productType = p.productType.name;
			templateVariables.productCategory = p.productType.category.name;
			templateVariables.startDate = formatDateString(p.warrantyStartDate);
			templateVariables.endDate = formatDateString(p.warrantyEndDate);
			templateVariables.status =
				today >= (startDate || new Date()) && today <= (endDate || new Date())
					? "Aktif ✓"
					: "Tidak Aktif ✗";
		} else if (notificationType === "dealer_ready" && productData) {
			templateFileName = "waiting-list-notify-dealer-ready";
			const p = productData;
			templateVariables.productType = p.productType.name;
			templateVariables.productCategory = p.productType.category.name;
		}

		// Send email
		await sendEmail({
			to: entry.requesterEmail || "",
			subject:
				notificationType === "check_sn"
					? "Verifikasi Serial Number Produk Anda"
					: notificationType === "dealer_ready"
						? "Produk Anda Siap Didaftarkan"
						: "Status Garansi Produk Anda",
			templateFileName,
			templateVariables,
		});

		// Log notification to database
		await db
			.insert(notification)
			.values({
				id: crypto.randomUUID(),
				userId,
				title:
					notificationType === "check_sn"
						? "Verifikasi Serial Number"
						: notificationType === "dealer_ready"
							? "Produk Siap Didaftarkan"
							: "Status Garansi Tersedia",
				body: `Notifikasi dikirim ke ${entry.requesterEmail}`,
				type: notificationType === "dealer_ready" ? "product_ready" : "general",
				relatedWaitingListId: id,
			});

		// Update waiting list entry
		const updated = await db
			.update(waitingList)
			.set({
				status: "notified",
				notifiedAt: new Date(),
				notifiedBy,
			})
			.where(eq(waitingList.id, id))
			.returning();

		const parsed = waitingListSchema.parse(updated[0]);
		return parsed;
	},
};
