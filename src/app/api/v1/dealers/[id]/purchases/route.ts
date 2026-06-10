import { HTTP_STATUS } from "@/constants/http-status.constant";
import { db } from "@/db";
import { purchase, purchaseItem, product, customer, auditLog } from "@/db/schema";
import { errorResponse, successResponse } from "@/lib/api/api-response";
import { authenticationMiddleware } from "@/lib/api/auth.middleware";
import { getHttpErrorStatus } from "@/lib/api/get-http-error-status";
import { getSafeErrorMessage } from "@/lib/api/get-safe-error-message";
import { HttpError } from "@/lib/api/http-error";
import { normalizeError } from "@/lib/errors/normalize-error";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import crypto from "crypto";

interface RouteContext {
	params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
	try {
		const { id: dealerId } = await context.params;

		const session = await authenticationMiddleware();

		const purchases = await db.query.purchase.findMany({
			where: eq(purchase.dealerId, dealerId),
			with: {
				customer: true,
				items: {
					with: {
						product: {
							with: {
								productType: {
									with: {
										category: true,
									},
								},
								warrantyCondition: true,
							},
						},
					},
				},
				invoice: true,
			},
			orderBy: (p, { desc }) => [desc(p.purchaseDate)],
		});

		const data = purchases.map((p) => {
			const warrantyEndDates = p.items
				.map((item) => item.product.warrantyEndDate)
				.filter((date) => date !== null);

			const latestWarrantyEnd =
				warrantyEndDates.length > 0
					? new Date(
							Math.max(
								...warrantyEndDates.map((d) => new Date(d as string).getTime()),
							),
						)
					: null;

			return {
				id: p.id,
				customerProfile: {
					id: p.customer.id,
					name: p.customer.name,
					email: p.customer.email,
					phone: p.customer.phone,
					address: p.customer.address,
				},
				purchaseDate: p.purchaseDate,
				warrantyEndDate: latestWarrantyEnd ? latestWarrantyEnd.toISOString().split("T")[0] : null,
				items: p.items.map((item) => ({
					productId: item.product.id,
					serialNumber: item.product.serialNumber,
					productType: item.product.productType.name,
					productCategory: item.product.productType.category.name,
					warrantyStartDate: item.product.warrantyStartDate,
					warrantyEndDate: item.product.warrantyEndDate,
					warrantyStatus:
						item.product.status === "none"
							? "none"
							: item.product.warrantyEndDate && new Date(item.product.warrantyEndDate) < new Date()
								? "expired"
								: "active",
					warrantyCondition:
						item.product.warrantyCondition?.condition || null,
				})),
				invoiceFile: p.invoice ? p.invoice.originalFilename : null,
				totalProducts: p.items.length,
			};
		});

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: session.user.id,
			category: "DEALER",
			event: "VIEW_DEALER_PURCHASES",
			status: "success",
			priority: "low",
			data: { dealerId, purchaseCount: data.length },
		});

		return NextResponse.json(
			successResponse({
				message: "Pembelian dealer berhasil diambil",
				data,
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
