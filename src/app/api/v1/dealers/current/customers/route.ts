import { HTTP_STATUS } from "@/constants/http-status.constant";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { errorResponse, successResponse } from "@/lib/api/api-response";
import { authenticationMiddleware, authorizationMiddleware } from "@/lib/api/auth.middleware";
import { getHttpErrorStatus } from "@/lib/api/get-http-error-status";
import { getSafeErrorMessage } from "@/lib/api/get-safe-error-message";
import { HttpError } from "@/lib/api/http-error";
import { normalizeError } from "@/lib/errors/normalize-error";
import { dealerCustomerService } from "@/services/dealer-customer.service";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);

		const session = await authenticationMiddleware();

		await authorizationMiddleware({
			allowedRole: ["dealer"],
			currentRole: session.user.role,
		});

		const search = searchParams.get("search") || "";

		const result = await dealerCustomerService.getDealerCustomers({
			userId: session.user.id,
			search,
		});

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: session.user.id,
			category: "DEALER",
			event: "VIEW_DEALER_CUSTOMERS",
			status: "success",
			priority: "low",
			data: { dealerId: result.dealerId, searchQuery: search, customerCount: result.items.length },
		});

		return NextResponse.json(
			successResponse({
				message: "Customer dealer berhasil diambil",
				data: result.items,
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
