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
import { db } from "@/db";
import { dealers, user } from "@/db/schema";
import { eq } from "drizzle-orm";

const validateDealerSchema = z.object({
	name: z.string().min(1, "Nama wajib diisi"),
	email: z.string().email("Format email tidak valid"),
	phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
	try {
		const session = await authenticationMiddleware();
		await authorizationMiddleware({
			allowedRole: ["admin", "sales"],
			currentRole: session.user.role,
		});

		const body = await req.json();
		const parsed = validateDealerSchema.parse(body);

		// Check if dealer already exists
		const existingDealer = await db.query.dealers.findFirst({
			where: eq(dealers.name, parsed.name),
		});

		if (existingDealer) {
			throw new HttpError(
				`Dealer '${parsed.name}' sudah terdaftar`,
				HTTP_STATUS.CONFLICT.code,
			);
		}

		// Check if email already exists
		const existingUser = await db.query.user.findFirst({
			where: eq(user.email, parsed.email),
		});

		if (existingUser) {
			throw new HttpError(
				"Email sudah terdaftar",
				HTTP_STATUS.CONFLICT.code,
			);
		}

		return NextResponse.json(
			successResponse({
				message: "Validasi berhasil - dealer dapat dibuat",
				data: { isValid: true },
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
