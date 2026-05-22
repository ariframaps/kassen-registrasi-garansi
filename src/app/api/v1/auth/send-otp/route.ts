import { HTTP_STATUS } from "@/constants/http-status.constant";
// import { missingBodyError } from "@/lib/api/api-missing-body-error";
import { errorResponse, successResponse } from "@/lib/api/api-response";
import { getHttpErrorStatus } from "@/lib/api/get-http-error-status";
import { getSafeErrorMessage } from "@/lib/api/get-safe-error-message";
import { normalizeError } from "@/lib/errors/normalize-error";
import { authService } from "@/services/auth.service";
import { NextResponse } from "next/server";
import { z } from "zod";

const sendOtpBodySchema = z.object({
	email: z.email({ error: "Email wajib diisi" }),
});

export type SendOtpResponseData = null;

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { email } = sendOtpBodySchema.parse(body);

		await authService.sendOtp({ email });

		return NextResponse.json(
			successResponse({
				message: "Success",
				data: null as SendOtpResponseData,
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
