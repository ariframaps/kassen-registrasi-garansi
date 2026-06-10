import { HTTP_STATUS } from "@/constants/http-status.constant";
import { db } from "@/db";
import { product, productType, productSchema, auditLog } from "@/db/schema";
import { errorResponse, successResponse } from "@/lib/api/api-response";
import { authenticationMiddleware } from "@/lib/api/auth.middleware";
import { getHttpErrorStatus } from "@/lib/api/get-http-error-status";
import { getSafeErrorMessage } from "@/lib/api/get-safe-error-message";
import { HttpError } from "@/lib/api/http-error";
import { normalizeError } from "@/lib/errors/normalize-error";
import { and, eq, ilike, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import crypto from "crypto";

interface RouteContext {
	params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
	try {
		const { id: dealerId } = await context.params;
		const { searchParams } = new URL(request.url);

		const session = await authenticationMiddleware();

		const page = parseInt(searchParams.get("page") || "1", 10);
		const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
		const search = searchParams.get("search") || "";
		const categoryId = searchParams.get("categoryId") || "";

		if (page < 1 || pageSize < 1)
			throw new HttpError(
				"Page dan pageSize harus bernilai positif",
				HTTP_STATUS.BAD_REQUEST.code,
			);

		const limit = Math.min(pageSize, 100);
		const offset = (page - 1) * limit;

		const filters: any[] = [eq(product.dealerId, dealerId)];

		if (search) {
			filters.push(
				or(
					ilike(product.serialNumber, `%${search}%`),
					ilike(productType.name, `%${search}%`),
				),
			);
		}

		const whereClause = filters.length > 1 ? and(...filters) : filters[0];

		const result = await db.query.product.findMany({
			where: whereClause,
			with: {
				productType: {
					with: {
						category: true,
					},
				},
				warrantyCondition: true,
			},
			limit,
			offset,
		});

		const totalResult = await db.query.product.findMany({
			where: whereClause,
		});

		const data = result.map((p) => ({
			id: p.id,
			serialNumber: p.serialNumber,
			productType: p.productType.name,
			productCategory: p.productType.category.name,
			warrantyStatus:
				p.status === "none"
					? "none"
					: p.warrantyEndDate && new Date(p.warrantyEndDate) < new Date()
						? "expired"
						: "active",
			customerName: null,
			warrantyStartDate: p.warrantyStartDate,
			warrantyEndDate: p.warrantyEndDate,
		}));

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: session.user.id,
			category: "DEALER",
			event: "VIEW_DEALER_PRODUCTS",
			status: "success",
			priority: "low",
			data: { dealerId, searchQuery: search, categoryFilter: categoryId, itemCount: data.length },
		});

		return NextResponse.json(
			successResponse({
				message: "Produk dealer berhasil diambil",
				data: {
					items: data,
					total: totalResult.length,
					page,
					pageSize: limit,
				},
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
