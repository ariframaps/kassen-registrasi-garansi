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

const pendingDealerCreationSchema = z.object({
	name: z.string(),
	email: z.string(),
	phone: z.string().optional(),
});

const pendingCustomerCreationSchema = z.object({
	name: z.string(),
	email: z.string().optional(),
	phone: z.string().optional(),
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

const uploadSchema = z.object({
	file: z.instanceof(File),
	destType: z.enum(["dealer", "customer"]),
	destLabel: z.string().min(1, "Destination label diperlukan"),
	pendingDealerCreation: pendingDealerCreationSchema.optional(),
	pendingCustomerCreation: pendingCustomerCreationSchema.optional(),
	pendingItemCodes: z.array(pendingItemCodeSchema).optional(),
	purchaseData: purchaseDataSchema.optional(),
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
		const pendingDealerCreationStr = formData.get("pendingDealerCreation") as string | null;
		const pendingCustomerCreationStr = formData.get("pendingCustomerCreation") as string | null;
		const pendingItemCodesStr = formData.get("pendingItemCodes") as string | null;
		const purchaseDataStr = formData.get("purchaseData") as string | null;

		let purchaseData: any = undefined;
		if (purchaseDataStr) {
			purchaseData = JSON.parse(purchaseDataStr);
			// Remove invoiceFile from purchaseData if it exists, we'll handle it separately later
			if (purchaseData.invoiceFile) {
				delete purchaseData.invoiceFile;
			}
		}

		const parsedData = uploadSchema.parse({
			file,
			destType,
			destLabel,
			pendingDealerCreation: pendingDealerCreationStr ? JSON.parse(pendingDealerCreationStr) : undefined,
			pendingCustomerCreation: pendingCustomerCreationStr ? JSON.parse(pendingCustomerCreationStr) : undefined,
			pendingItemCodes: pendingItemCodesStr ? JSON.parse(pendingItemCodesStr) : undefined,
			purchaseData: purchaseData,
		});

		const result = await submitAccurateFile({
			file: parsedData.file,
			destType: parsedData.destType,
			destLabel: parsedData.destLabel,
			userId: session.user.id,
			pendingDealerCreation: parsedData.pendingDealerCreation,
			pendingCustomerCreation: parsedData.pendingCustomerCreation,
			pendingItemCodes: parsedData.pendingItemCodes,
			purchaseData: parsedData.purchaseData,
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
