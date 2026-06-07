import { NextResponse } from "next/server";
import {
	productTypeService,
	updateProductTypePayloadSchema,
} from "@/services/product-type.service";
import { HTTP_STATUS } from "@/constants/http-status.constant";
import { successResponse, errorResponse } from "@/lib/api/api-response";
import {
	authenticationMiddleware,
	authorizationMiddleware,
} from "@/lib/api/auth.middleware";
import { getHttpErrorStatus } from "@/lib/api/get-http-error-status";
import { getSafeErrorMessage } from "@/lib/api/get-safe-error-message";
import { HttpError } from "@/lib/api/http-error";
import { normalizeError } from "@/lib/errors/normalize-error";

// Reuse parameter types safely
interface RouteContext {
	params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
	try {
		const { id } = await context.params;
		const body = await request.json();
		const parsedBody = updateProductTypePayloadSchema.parse(body);

		const session = await authenticationMiddleware();
		await authorizationMiddleware({
			allowedRole: ["admin", "sales"],
			currentRole: session.user.role,
		});

		const data = await productTypeService.update(id, parsedBody);

		return NextResponse.json(successResponse({ message: "Success", data }), {
			status: HTTP_STATUS.OK.code,
		});
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

export async function DELETE(request: Request, context: RouteContext) {
	try {
		const { id } = await context.params;

		const session = await authenticationMiddleware();
		await authorizationMiddleware({
			allowedRole: ["admin", "sales"],
			currentRole: session.user.role,
		});

		await productTypeService.delete(id);

		return NextResponse.json(
			successResponse({ message: "Success deleted", data: undefined }),
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
