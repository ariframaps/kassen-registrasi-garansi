import { HTTP_STATUS } from "@/constants/http-status.constant";
import { errorResponse, successResponse } from "@/lib/api/api-response";
import { getHttpErrorStatus } from "@/lib/api/get-http-error-status";
import { getSafeErrorMessage } from "@/lib/api/get-safe-error-message";
import { auth } from "@/lib/auth";
import { normalizeError } from "@/lib/errors/normalize-error";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const session = await auth.api.getSession({
		headers: await headers(), // you need to pass the headers object.
	});

	console.log(session);

	try {
		return NextResponse.json(
			successResponse({
				message: "Success",
				data: null,
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
