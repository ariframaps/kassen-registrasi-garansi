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
import { updateUserSchema, userService } from "@/services/user.service";
import { NextResponse } from "next/server";

export async function PUT(
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

		const body = await request.json();
		const parsedBody = updateUserSchema.parse(body);

		const ipAddress =
			request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
			request.headers.get("x-real-ip");
		const userAgent = request.headers.get("user-agent");

		const data = await userService.update(id, parsedBody, {
			userId: session.user.id,
			ipAddress,
			userAgent,
		});

		return NextResponse.json(
			successResponse({ message: "User berhasil diperbarui", data }),
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

export async function DELETE(
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

		const data = await userService.delete(id, {
			userId: session.user.id,
			ipAddress,
			userAgent,
		});

		return NextResponse.json(
			successResponse({ message: "User berhasil dihapus", data }),
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

export async function PATCH(
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

		const data = await userService.toggleStatus(id, {
			userId: session.user.id,
			ipAddress,
			userAgent,
		});

		return NextResponse.json(
			successResponse({ message: "Status user berhasil diubah", data }),
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
