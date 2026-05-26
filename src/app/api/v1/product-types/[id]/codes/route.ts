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
import { itemCodeService } from "@/services/item-code.service";
import { NextResponse } from "next/server";
import z from "zod";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;

	try {
		const session = await authenticationMiddleware();
		await authorizationMiddleware({
			allowedRole: ["admin", "sales"],
			currentRole: session.user.role,
		});

		const data = await itemCodeService.getItemCodesByType({ typeId: id });

		return NextResponse.json(
			successResponse({
				message: "Success",
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

const updateSchema = z.object({
	typeId: z.string().min(1, "typeId tidak boleh kosong"),
	data: z.object({
		deleted: z.string().array(), // atau z.array(z.string())
		added: z.string().array(), // sesuai dengan typo 'aded' di json Anda
	}),
});

export async function PATCH(request: Request) {
	const body = await request.json();
	const parsedBody = updateSchema.parse(body);

	try {
		const session = await authenticationMiddleware();
		await authorizationMiddleware({
			allowedRole: ["admin", "sales"],
			currentRole: session.user.role,
		});

		const data = await itemCodeService.update(parsedBody);
		console.log(data);

		return NextResponse.json(
			successResponse({
				message: "Success",
				data: data,
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
