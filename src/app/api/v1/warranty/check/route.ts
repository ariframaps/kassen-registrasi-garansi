import { HTTP_STATUS } from "@/constants/http-status.constant";
import { errorResponse, successResponse } from "@/lib/api/api-response";
import { getHttpErrorStatus } from "@/lib/api/get-http-error-status";
import { getSafeErrorMessage } from "@/lib/api/get-safe-error-message";
import { normalizeError } from "@/lib/errors/normalize-error";
import { warrantyService } from "@/services/warranty.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const sn = request.nextUrl.searchParams.get("sn");
		if (!sn || !sn.trim()) {
			return NextResponse.json(
				errorResponse({
					message: "Serial number is required",
					issues: [],
				}),
				{ status: HTTP_STATUS.BAD_REQUEST.code },
			);
		}

		const data = await warrantyService.checkWarranty(sn.trim());
    console.log(data)
		return NextResponse.json(
			successResponse({
				message: "Success",
				data,
			}),
			{ status: HTTP_STATUS.OK.code },
		);
	} catch (error) {
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
