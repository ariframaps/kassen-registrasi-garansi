import { HTTP_STATUS } from "@/constants/http-status.constant";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { errorResponse, successResponse } from "@/lib/api/api-response";
import { authenticationMiddleware, authorizationMiddleware } from "@/lib/api/auth.middleware";
import { getHttpErrorStatus } from "@/lib/api/get-http-error-status";
import { getSafeErrorMessage } from "@/lib/api/get-safe-error-message";
import { HttpError } from "@/lib/api/http-error";
import { normalizeError } from "@/lib/errors/normalize-error";
import { dealerProductService } from "@/services/dealer-product.service";
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

		const page = parseInt(searchParams.get("page") || "1", 10);
		const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
		const search = searchParams.get("search") || "";
		const categoryId = searchParams.get("categoryId") || "";

		if (page < 1 || pageSize < 1)
			throw new HttpError(
				"Page dan pageSize harus bernilai positif",
				HTTP_STATUS.BAD_REQUEST.code,
			);

		const result = await dealerProductService.getDealerProducts({
			userId: session.user.id,
			page,
			pageSize,
			search,
			categoryId,
		});

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: session.user.id,
			category: "DEALER",
			event: "VIEW_DEALER_PRODUCTS",
			status: "success",
			priority: "low",
			data: {
				dealerId: result.dealerId,
				searchQuery: search,
				categoryFilter: categoryId,
				itemCount: result.items.length,
			},
		});

		return NextResponse.json(
			successResponse({
				message: "Produk dealer berhasil diambil",
				data: {
					items: result.items,
					total: result.total,
					page: result.page,
					pageSize: result.pageSize,
				},
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
