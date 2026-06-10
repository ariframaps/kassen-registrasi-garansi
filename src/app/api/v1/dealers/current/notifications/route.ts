import { NextRequest, NextResponse } from "next/server";
import { HTTP_STATUS } from "@/constants/http-status.constant";
import { errorResponse, successResponse } from "@/lib/api/api-response";
import {
	authenticationMiddleware,
	authorizationMiddleware,
} from "@/lib/api/auth.middleware";
import { getHttpErrorStatus } from "@/lib/api/get-http-error-status";
import { getSafeErrorMessage } from "@/lib/api/get-safe-error-message";
import { HttpError } from "@/lib/api/http-error";
import { normalizeError } from "@/lib/errors/normalize-error";
import { notificationService } from "@/services/notification.service";
import { db } from "@/db";
import { dealers, notification, product as productTable, productType as productTypeTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
	try {
		const session = await authenticationMiddleware();
		await authorizationMiddleware({
			allowedRole: ["dealer"],
			currentRole: session.user.role,
		});

		// Get dealer by userId
		const dealer = await db.query.dealers.findFirst({
			where: eq(dealers.userId, session.user.id),
		});

		if (!dealer) {
			return NextResponse.json(
				errorResponse({
					message: "Dealer tidak ditemukan untuk user ini",
					issues: [],
				}),
				{ status: HTTP_STATUS.NOT_FOUND.code },
			);
		}

		// Get notifications for current user
		const notifications = await db.query.notification.findMany({
			where: eq(notification.userId, session.user.id),
			orderBy: (n) => [n.createdAt],
			with: {
				relatedWaitingList: {
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
				},
			},
		});

		// Map to DealerNotification format
		const mappedNotifications = notifications.map((n) => {
			const serialNumber = n.relatedWaitingList?.product?.serialNumber || "";
			const productType = n.relatedWaitingList?.product?.productType?.name || "";

			return {
				id: n.id,
				type: n.type,
				serialNumber,
				productType,
				message: n.body,
				createdAt: n.createdAt.toISOString(),
				read: n.isRead,
			};
		});

		return NextResponse.json(
			successResponse({
				message: "Notifikasi berhasil diambil",
				data: mappedNotifications,
			}),
			{ status: HTTP_STATUS.OK.code },
		);
	} catch (error) {
		if (error instanceof HttpError) {
			return NextResponse.json(
				errorResponse({ message: error.message, issues: [] }),
				{ status: error.statusCode },
			);
		}

		const normalized = normalizeError(error);
		return NextResponse.json(
			errorResponse({
				message: getSafeErrorMessage(normalized),
				issues: normalized.issues,
			}),
			{ status: getHttpErrorStatus(normalized) },
		);
	}
}
