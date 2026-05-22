import { HTTP_STATUS } from "@/constants/http-status.constant";
// import { missingBodyError } from "@/lib/api/api-missing-body-error";
import { errorResponse, successResponse } from "@/lib/api/api-response";
import { getHttpErrorStatus } from "@/lib/api/get-http-error-status";
import { getSafeErrorMessage } from "@/lib/api/get-safe-error-message";
import { envServer } from "@/lib/env-server";
import { normalizeError } from "@/lib/errors/normalize-error";
import { verifyToken } from "@/lib/jwt";
import { authService } from "@/services/auth.service";
import { JWTPayload, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export type CheckCookieResponseData = JWTPayload;

export async function GET(request: NextRequest) {
	// const token = request.cookies.get("auth_token")?.value;
	// console.log(token);

	const authHeader = request.headers.get("Authorization");

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return NextResponse.json(
			{ error: "Missing or malformed Bearer token" },
			{ status: 401 },
		);
	}

	const token = authHeader.slice(7); // Remove "Bearer " prefix

	try {
		if (!token) throw new Error("cookie not found");
		const payload = await verifyToken(token);

		return NextResponse.json(
			successResponse({
				message: "Success",
				data: payload as CheckCookieResponseData,
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
