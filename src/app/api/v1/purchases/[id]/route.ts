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
import {
	purchaseService,
	updatePurchaseSchema,
} from "@/services/purchase.service";
import { NextResponse } from "next/server";

interface RouteContext {
	params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
	try {
		const { id } = await context.params;
		const body = await request.json();
		const parsedBody = updatePurchaseSchema.parse(body);

		const session = await authenticationMiddleware();
		await authorizationMiddleware({
			allowedRole: ["admin", "sales"],
			currentRole: session.user.role,
		});

		const ipAddress =
			request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
			request.headers.get("x-real-ip");
		const userAgent = request.headers.get("user-agent");

		const data = await purchaseService.updatePurchase(id, parsedBody, {
			userId: session.user.id,
			ipAddress,
			userAgent,
		});

		return NextResponse.json(
			successResponse({ message: "Pembelian berhasil diperbarui", data }),
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
