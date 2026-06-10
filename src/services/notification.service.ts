import { db } from "@/db";
import {
	notification,
	waitingList,
	product as productTable,
	dealers,
	productType,
	WaitingListSchema,
	NotificationSchema,
} from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { HTTP_STATUS } from "@/constants/http-status.constant";
import { HttpError } from "@/lib/api/http-error";
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

export const notificationService = {
	// Create dealer request product notification
	createDealerRequestNotification: async (data: {
		dealerId: string;
		productTypeId: string;
		serialNumberRequested?: string;
		notes?: string;
	}): Promise<WaitingListSchema> => {
		const dealer = await db.query.dealers.findFirst({
			where: eq(dealers.id, data.dealerId),
			with: {
				user: true,
			},
		});

		if (!dealer) {
			throw new HttpError("Dealer tidak ditemukan", HTTP_STATUS.NOT_FOUND.code);
		}

		// Validate that product type exists
		const productTypeData = await db.query.productType.findFirst({
			where: eq(productType.id, data.productTypeId),
		});

		if (!productTypeData) {
			throw new HttpError(
				"Product Type tidak ditemukan",
				HTTP_STATUS.NOT_FOUND.code,
			);
		}

		const result = await db
			.insert(waitingList)
			.values({
				id: crypto.randomUUID(),
				serialNumberRequested: data.serialNumberRequested || "PENDING",
				requesterType: "dealer",
				requesterName: dealer.name,
				requesterEmail: dealer.email,
				requesterPhone: dealer.phone || null,
				dealerId: data.dealerId,
				productTypeId: data.productTypeId,
				status: "pending",
			})
			.returning();

		return result[0];
	},

	// Check and notify about product match after upload
	checkAndNotifyProductMatch: async (options: {
		dealerId?: string;
		productsCreated: Array<{
			id: string;
			serialNumber: string;
			productTypeId: string;
		}>;
		uploadedBy: string;
	}): Promise<void> => {
		const { dealerId, productsCreated, uploadedBy } = options;

		if (!dealerId || productsCreated.length === 0) {
			return;
		}

		// Get dealer with user info
		const dealerData = await db.query.dealers.findFirst({
			where: eq(dealers.id, dealerId),
			with: {
				user: true,
			},
		});

		if (!dealerData) {
			return;
		}

		// Check for pending requests for this dealer
		const pendingRequests = await db.query.waitingList.findMany({
			where: and(
				eq(waitingList.dealerId, dealerId),
				eq(waitingList.status, "pending"),
				eq(waitingList.requesterType, "dealer"),
			),
		});

		if (pendingRequests.length === 0) {
			return;
		}

		// Get product type info for created products with categories
		const productTypes = await db.query.productType.findMany({
			with: {
				category: true,
			},
		});
		const typeMap = new Map(productTypes.map((pt) => [pt.id, pt]));

		// Create notifications for matching requests
		for (const request of pendingRequests) {
			// Check if any created product matches the request
			const matchingProducts = productsCreated.filter((p) => {
				// If request has specific SN (not "PENDING"), match by SN
				if (request.serialNumberRequested && request.serialNumberRequested !== "PENDING") {
					return p.serialNumber === request.serialNumberRequested;
				}
				// Otherwise match by product type
				if (request.productTypeId) {
					return p.productTypeId === request.productTypeId;
				}
				return false;
			});

			if (matchingProducts.length === 0) {
				continue;
			}

			// Get product type for the matched product
			const productTypeData = typeMap.get(matchingProducts[0].productTypeId);

			if (!productTypeData) {
				continue;
			}

			const notificationId = crypto.randomUUID();
			await db
				.insert(notification)
				.values({
					id: notificationId,
					userId: dealerData.userId,
					title: `Produk ${productTypeData.name} Siap Didistribusikan`,
					body: `Produk request Anda ${productTypeData.name} telah di-upload oleh Sales dan siap untuk didistribusikan ke customer.`,
					type: "product_ready",
					relatedWaitingListId: request.id,
				});

			// Update waiting list status
			await db
				.update(waitingList)
				.set({
					status: "notified",
					notifiedAt: new Date(),
					notifiedBy: uploadedBy,
					productId: matchingProducts[0].id,
				})
				.where(eq(waitingList.id, request.id));

			// Send email notification
			try {
				await sendEmail({
					to: dealerData.email,
					subject: `Produk ${productTypeData.name} Siap Didistribusikan`,
					templateFileName: "dealer-product-ready",
					templateVariables: {
						dealerName: dealerData.name,
						productType: productTypeData.name,
						productCategory: productTypeData.category?.name || "",
						serialNumbers: matchingProducts
							.map((p) => p.serialNumber)
							.join(", "),
					} as TemplateVariables,
				});
			} catch (error) {
				console.error("Failed to send notification email:", error);
			}
		}
	},

	// Get dealer notifications
	getDealerNotifications: async (userId: string): Promise<NotificationSchema[]> => {
		const dealer = await db.query.dealers.findFirst({
			where: eq(dealers.userId, userId),
		});

		if (!dealer) {
			throw new HttpError("Dealer tidak ditemukan", HTTP_STATUS.NOT_FOUND.code);
		}

		const notifs = await db.query.notification.findMany({
			where: eq(notification.userId, userId),
			orderBy: (n) => [n.createdAt],
			limit: 50,
		});

		return notifs;
	},

	// Mark notification as read
	markAsRead: async (notificationId: string, userId: string): Promise<NotificationSchema> => {
		const notif = await db.query.notification.findFirst({
			where: eq(notification.id, notificationId),
		});

		if (!notif) {
			throw new HttpError(
				"Notifikasi tidak ditemukan",
				HTTP_STATUS.NOT_FOUND.code,
			);
		}

		if (notif.userId !== userId) {
			throw new HttpError(
				"Tidak memiliki akses ke notifikasi ini",
				HTTP_STATUS.FORBIDDEN.code,
			);
		}

		const updated = await db
			.update(notification)
			.set({ isRead: true })
			.where(eq(notification.id, notificationId))
			.returning();

		return updated[0];
	},

	// Get unread count
	getUnreadCount: async (userId: string): Promise<number> => {
		const result = await db.query.notification.findMany({
			where: and(eq(notification.userId, userId), eq(notification.isRead, false)),
		});

		return result.length;
	},
};
