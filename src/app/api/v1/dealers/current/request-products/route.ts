import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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
import { dealers } from "@/db/schema";
import { eq } from "drizzle-orm";

const requestProductSchema = z.object({
	productTypeId: z.string().min(1, "Product Type ID diperlukan"),
	serialNumberRequested: z.string().optional(),
	notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
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

		const body = await req.json();
		const parsedData = requestProductSchema.parse(body);

		const result = await notificationService.createDealerRequestNotification({
			dealerId: dealer.id,
			productTypeId: parsedData.productTypeId,
			serialNumberRequested: parsedData.serialNumberRequested,
			notes: parsedData.notes,
		});

		return NextResponse.json(
			successResponse({
				message: "Request produk berhasil dibuat",
				data: result,
			}),
			{ status: HTTP_STATUS.CREATED.code },
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
