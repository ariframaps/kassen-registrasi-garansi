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
import { validateAccurateFile } from "@/services/accurate.service";
import { ParsedDeliveryOrder } from "@/lib/parser-accurate";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const validateRequestSchema = z.object({
	doNumber: z.string(),
	date: z.string(),
	sentBy: z.string(),
	orderRef: z.string(),
	area: z.string(),
	shipTo: z.string(),
	items: z.array(
		z.object({
			itemCode: z.string(),
			itemDescription: z.string(),
			qty: z.number(),
			unit: z.string(),
			serialNumbers: z.array(z.string()),
		}),
	),
	totalQty: z.number(),
	totalItem: z.number(),
});

export async function POST(request: NextRequest) {
	try {
		const session = await authenticationMiddleware();
		await authorizationMiddleware({
			allowedRole: ["admin", "sales"],
			currentRole: session.user.role,
		});

		// Parse JSON body
		const body = await request.json();

		// Validate parsed delivery order structure
		const parsedData = validateRequestSchema.parse(body) as ParsedDeliveryOrder;

		// Validate file data and return preview rows
		const previewRows = await validateAccurateFile(parsedData);

		// Count statuses
		const validCount = previewRows.filter((r) => r.status === "valid").length;
		const dupCount = previewRows.filter((r) => r.status === "duplicate").length;
		const unknownCount = previewRows.filter(
			(r) => r.status === "unknown_type",
		).length;

		return NextResponse.json(
			successResponse({
				message: "Preview validasi file berhasil diproses",
				data: {
					preview: previewRows,
					validCount,
					dupCount,
					unknownCount,
				},
			}),
			{ status: HTTP_STATUS.OK.code },
		);
	} catch (error) {
		if (error instanceof HttpError) {
			return NextResponse.json(
				errorResponse({
					message: error.message,
					issues: [],
				}),
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
