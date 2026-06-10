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
import { waitingListService } from "@/services/waiting-list.service";
import { NextResponse } from "next/server";
import { z } from "zod";

const notifySchema = z.object({
	notificationType: z.enum(["check_sn", "warranty_detail", "dealer_ready"]),
});

interface RouteContext {
	params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
	const { id } = await context.params;

	try {
		const session = await authenticationMiddleware();
		await authorizationMiddleware({
			allowedRole: ["admin", "sales"],
			currentRole: session.user.role,
		});

		const body = await request.json();
		const validated = notifySchema.parse(body);

		const data = await waitingListService.notify({
			id,
			notificationType: validated.notificationType,
			notifiedBy: session.user.id,
			userId: session.user.id,
		});

		return NextResponse.json(
			successResponse({
				message: "Notification sent successfully",
				data,
			}),
			{ status: HTTP_STATUS.OK.code },
		);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				errorResponse({
					message: "Validation error",
					issues: error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
				}),
				{ status: HTTP_STATUS.BAD_REQUEST.code },
			);
		}

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
