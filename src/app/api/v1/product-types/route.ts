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
import {
	createProductTypePayloadSchema,
	productTypeService,
} from "@/services/product-type.service";
import { NextResponse } from "next/server";
import { productTypeInsertSchema } from "@/db/schema";

export async function GET() {
	try {
		const session = await authenticationMiddleware();
		await authorizationMiddleware({
			allowedRole: ["admin", "sales"],
			currentRole: session.user.role,
		});

		const data = await productTypeService.getAll();

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

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const parsedBody = createProductTypePayloadSchema.parse(body);

		const session = await authenticationMiddleware();
		await authorizationMiddleware({
			allowedRole: ["admin", "sales"],
			currentRole: session.user.role,
		});

		const data = await productTypeService.add(parsedBody);

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

// export async function GET() {
// 	try {
// 		const session = await authenticationMiddleware();
// 		await authorizationMiddleware({
// 			allowedRole: ["admin", "sales"],
// 			currentRole: session.user.role,
// 		});

// 		const data = await productTypeService.getAllWithNested();

// 		return NextResponse.json(
// 			successResponse({
// 				message: "Success",
// 				data,
// 			}),
// 			{ status: HTTP_STATUS.OK.code },
// 		);
// 	} catch (error) {
// 		if (error instanceof HttpError) {
// 			console.log("HTTP ERROR: ", error);
// 			return NextResponse.json(
// 				errorResponse({
// 					message: error.message,
// 					issues: [],
// 				}),
// 				{ status: error.statusCode },
// 			);
// 		}

// 		const normalized = normalizeError(error);
// 		return NextResponse.json(
// 			errorResponse({
// 				message: getSafeErrorMessage(normalized),
// 				issues: normalized.issues,
// 			}),
// 			{ status: getHttpErrorStatus(normalized) },
// 		);
// 	}
// }

// export async function POST(request: Request) {
// 	const body = await request.json();
// 	const parsedBody = productTypeInsertSchema.parse(body);
// 	console.log(parsedBody);

// 	try {
// 		const session = await authenticationMiddleware();
// 		await authorizationMiddleware({
// 			allowedRole: ["admin", "sales"],
// 			currentRole: session.user.role,
// 		});

// 		const data = await productTypeService.add(parsedBody);

// 		return NextResponse.json(
// 			successResponse({
// 				message: "Success",
// 				data: data,
// 			}),
// 			{ status: HTTP_STATUS.OK.code },
// 		);
// 	} catch (error) {
// 		if (error instanceof HttpError) {
// 			return NextResponse.json(
// 				errorResponse({
// 					message: error.message,
// 					issues: [],
// 				}),
// 				{ status: error.statusCode },
// 			);
// 		}

// 		const normalized = normalizeError(error);
// 		return NextResponse.json(
// 			errorResponse({
// 				message: getSafeErrorMessage(normalized),
// 				issues: normalized.issues,
// 			}),
// 			{ status: getHttpErrorStatus(normalized) },
// 		);
// 	}
// }
