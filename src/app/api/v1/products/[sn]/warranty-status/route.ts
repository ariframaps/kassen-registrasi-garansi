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
import { productService } from "@/services/product.service";
import { z } from "zod";
import { NextResponse } from "next/server";

const updateWarrantyStatusSchema = z.object({
	condition: z.enum(["valid", "rejected"]),
	reason: z.string().optional().default(""),
});

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ sn: string }> },
) {
	const { sn } = await params;

	try {
		const session = await authenticationMiddleware();
		await authorizationMiddleware({
			allowedRole: ["admin", "technical_support"],
			currentRole: session.user.role,
		});

		const body = await request.json();
		const validated = updateWarrantyStatusSchema.parse(body);

		// Find product by serial number to get its ID
		const product = await productService.findOneBySN({ SN: sn });
		if (!product) {
			return NextResponse.json(
				errorResponse({
					message: "Product not found",
					issues: [],
				}),
				{ status: HTTP_STATUS.NOT_FOUND.code },
			);
		}

		const data = await productService.updateWarrantyCondition({
			productId: product.id,
			condition: validated.condition,
			reason: validated.reason,
			userId: session.user.id,
		});

		return NextResponse.json(
			successResponse({
				message: "Warranty condition updated successfully",
				data,
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

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				errorResponse({
					message: "Validation error",
					issues: error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
				}),
				{ status: HTTP_STATUS.BAD_REQUEST.code },
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
