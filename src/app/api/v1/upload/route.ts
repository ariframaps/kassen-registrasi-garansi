import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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
import { submitAccurateFile } from "@/services/accurate.service";

const uploadSchema = z.object({
	file: z.instanceof(File),
	destType: z.enum(["dealer", "customer"]),
	destLabel: z.string().min(1, "Destination label diperlukan"),
});

export async function POST(req: NextRequest) {
	try {
		const session = await authenticationMiddleware();
		await authorizationMiddleware({
			allowedRole: ["admin", "sales"],
			currentRole: session.user.role,
		});

		const formData = await req.formData();
		const file = formData.get("file") as File | null;
		const destType = formData.get("destType") as string | null;
		const destLabel = formData.get("destLabel") as string | null;

		const parsedData = uploadSchema.parse({
			file,
			destType,
			destLabel,
		});

		const result = await submitAccurateFile({
			file: parsedData.file,
			destType: parsedData.destType,
			destLabel: parsedData.destLabel,
			userId: session.user.id,
		});

		console.log(result);

		return NextResponse.json(
			successResponse({
				message: "File berhasil diupload",
				data: {
					success: true,
					doNumber: result.doNumber,
					productsCreated: result.productsCreated,
				},
			}),
			{ status: HTTP_STATUS.CREATED.code },
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
