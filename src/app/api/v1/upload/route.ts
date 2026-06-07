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
import {
	accurateService,
	uploadAccurateSchema,
} from "@/services/accurate.service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const session = await authenticationMiddleware();
		await authorizationMiddleware({
			allowedRole: ["admin", "sales"],
			currentRole: session.user.role,
		});

		// Parse FormData
		const formData = await request.formData();
		const file = formData.get("file");
		const destType = formData.get("destType");
		const destLabel = formData.get("destLabel");

		// Validate inputs
		if (!file || !(file instanceof File)) {
			throw new HttpError(
				"File harus disertakan",
				HTTP_STATUS.BAD_REQUEST.code,
			);
		}

		// Validate file type
		const validTypes = [
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			"application/vnd.ms-excel",
		];
		if (!validTypes.includes(file.type)) {
			throw new HttpError(
				"Format file harus .xlsx atau .xls",
				HTTP_STATUS.BAD_REQUEST.code,
			);
		}

		// Validate and parse payload
		const payload = uploadAccurateSchema.parse({
			destType,
			destLabel,
		});

		const ipAddress =
			request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
			request.headers.get("x-real-ip");
		const userAgent = request.headers.get("user-agent");

		// Call service
		const result = await accurateService.upload(file, payload, {
			userId: session.user.id,
			ipAddress,
			userAgent,
		});

		return NextResponse.json(
			successResponse({
				message: `File Accurate berhasil diupload: ${result.productsCreated} produk ditambahkan`,
				data: result,
			}),
			{ status: HTTP_STATUS.CREATED.code },
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
