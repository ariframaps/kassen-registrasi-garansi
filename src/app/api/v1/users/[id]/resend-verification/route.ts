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
import { userService } from "@/services/user.service";
import { NextResponse } from "next/server";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	try {
		const session = await authenticationMiddleware();
		await authorizationMiddleware({
			allowedRole: ["admin"],
			currentRole: session.user.role,
		});

		const ipAddress =
			request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
			request.headers.get("x-real-ip");
		const userAgent = request.headers.get("user-agent");

		await userService.resendVerification(id, {
			userId: session.user.id,
			ipAddress,
			userAgent,
		});

		return NextResponse.json(
			successResponse({
				message: "Email verifikasi berhasil dikirim ulang",
				data: null,
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
