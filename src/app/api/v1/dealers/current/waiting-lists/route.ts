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
import { waitingListService } from "@/services/waiting-list.service";
import { db } from "@/db";
import { dealers, user } from "@/db/schema";
import { eq } from "drizzle-orm";

const createDealerWaitingListSchema = z.object({
	serialNumberRequested: z.string().min(1, "Serial number diperlukan"),
	notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
	try {
		const session = await authenticationMiddleware();
		await authorizationMiddleware({
			allowedRole: ["dealer"],
			currentRole: session.user.role,
		});

		// Get dealer info
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

		// Get user info for requester details
		const userData = await db.query.user.findFirst({
			where: eq(user.id, session.user.id),
		});

		if (!userData) {
			return NextResponse.json(
				errorResponse({
					message: "User tidak ditemukan",
					issues: [],
				}),
				{ status: HTTP_STATUS.NOT_FOUND.code },
			);
		}

		const body = await req.json();
		const parsedData = createDealerWaitingListSchema.parse(body);

		// Create waiting list entry
		const result = await waitingListService.create({
			serialNumberRequested: parsedData.serialNumberRequested,
			requesterType: "dealer",
			requesterName: dealer.name,
			requesterEmail: dealer.email,
			requesterPhone: dealer.phone || "",
			dealerId: dealer.id,
		});

		return NextResponse.json(
			successResponse({
				message: "Request produk berhasil dibuat",
				data: result,
			}),
			{ status: HTTP_STATUS.CREATED.code },
		);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				errorResponse({
					message: "Validation error",
					issues: error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
				}),
				{ status: HTTP_STATUS.BAD_REQUEST.code },
			);
		}

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
