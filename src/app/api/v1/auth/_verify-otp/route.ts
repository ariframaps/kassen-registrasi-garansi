import { HTTP_STATUS } from "@/constants/http-status.constant";
import { errorResponse, successResponse } from "@/lib/api/api-response";
import { getHttpErrorStatus } from "@/lib/api/get-http-error-status";
import { getSafeErrorMessage } from "@/lib/api/get-safe-error-message";
import { envServer } from "@/lib/env-server";
import { normalizeError } from "@/lib/errors/normalize-error";
import { authService } from "@/services/_auth.service";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const verifyOtpBodySchema = z.object({
	email: z.email(),
	otp: z.string().length(6),
});

export type VerifyOtpResponseData = null;

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { email, otp } = verifyOtpBodySchema.parse(body);

		const token = await authService.verifyOtp({ email, otp });

		const response = NextResponse.json(
			successResponse({
				message: "Success",
				data: null as VerifyOtpResponseData,
			}),
			{ status: HTTP_STATUS.OK.code },
		);

		response.cookies.set("auth_token", token, {
			httpOnly: true,
			secure: envServer.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: 60, // 1 menit
		});

		console.log(token);

		return response;
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
