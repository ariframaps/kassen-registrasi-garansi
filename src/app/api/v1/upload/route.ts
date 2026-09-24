/* eslint-disable @typescript-eslint/no-explicit-any */
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

const pendingCustomerCreationSchema = z.object({
	customId: z.string().min(1),
	name: z.string().min(1),
	categoryId: z.string().min(1),
	phone: z.string().optional(),
	address: z.string().optional(),
	email: z.string().optional(),
});

const pendingItemCodeSchema = z.object({
	code: z.string(),
	productTypeName: z.string(),
	categoryId: z.string(),
	warrantyDurationMonths: z.number(),
});

const purchaseDataSchema = z.object({
	purchaseDate: z.string().date(),
	notes: z.string().optional(),
	dealerId: z.string().optional(),
});

const uploadSchema = z
	.object({
		file: z.instanceof(File),
		selectedCustomerId: z.string().optional(),
		pendingCustomerCreation: pendingCustomerCreationSchema.optional(),
		pendingItemCodes: z.array(pendingItemCodeSchema).optional(),
		purchaseData: purchaseDataSchema.optional(),
	})
	.refine((data) => !!data.selectedCustomerId || !!data.pendingCustomerCreation, {
		message: "Customer/dealer tujuan wajib dipilih atau dibuat",
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
		const selectedCustomerId = formData.get("selectedCustomerId") as string | null;
		const pendingCustomerCreationStr = formData.get("pendingCustomerCreation") as string | null;
		const pendingItemCodesStr = formData.get("pendingItemCodes") as string | null;
		const purchaseDataStr = formData.get("purchaseData") as string | null;
		const invoiceFile = formData.get("invoiceFile") as File | null;

		let purchaseData: any = undefined;
		if (purchaseDataStr) {
			purchaseData = JSON.parse(purchaseDataStr);
		}

		const parsedData = uploadSchema.parse({
			file,
			selectedCustomerId: selectedCustomerId ?? undefined,
			pendingCustomerCreation: pendingCustomerCreationStr ? JSON.parse(pendingCustomerCreationStr) : undefined,
			pendingItemCodes: pendingItemCodesStr ? JSON.parse(pendingItemCodesStr) : undefined,
			purchaseData: purchaseData,
		});

		const result = await submitAccurateFile({
			file: parsedData.file,
			userId: session.user.id,
			selectedCustomerId: parsedData.selectedCustomerId,
			pendingCustomerCreation: parsedData.pendingCustomerCreation,
			pendingItemCodes: parsedData.pendingItemCodes,
			purchaseData: parsedData.purchaseData,
			invoiceFile: invoiceFile ?? undefined,
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
		console.log(error);

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
