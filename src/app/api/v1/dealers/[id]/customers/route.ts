import { HTTP_STATUS } from "@/constants/http-status.constant";
import { db } from "@/db";
import { purchase, customer, customerSchema, auditLog } from "@/db/schema";
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

		const search = searchParams.get("search") || "";

		const purchases = await db.query.purchase.findMany({
			where: eq(purchase.dealerId, dealerId),
			with: {
				customer: true,
			},
		});

		const customerMap = new Map<
			string,
			{ id: string; name: string; email: string; phone: string | null }
		>();
		purchases.forEach((p) => {
			if (!customerMap.has(p.customerId)) {
				customerMap.set(p.customerId, {
					id: p.customer.id,
					name: p.customer.name,
					email: p.customer.email,
					phone: p.customer.phone,
				});
			}
		});

		const customers = Array.from(customerMap.values());

		const filtered = search
			? customers.filter(
					(c) =>
						c.name.toLowerCase().includes(search.toLowerCase()) ||
						c.email.toLowerCase().includes(search.toLowerCase()) ||
						(c.phone && c.phone.toLowerCase().includes(search.toLowerCase())),
				)
			: customers;

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: session.user.id,
			category: "DEALER",
			event: "VIEW_DEALER_CUSTOMERS",
			status: "success",
			priority: "low",
			data: { dealerId, searchQuery: search, customerCount: filtered.length },
		});

		return NextResponse.json(
			successResponse({
				message: "Customer dealer berhasil diambil",
				data: filtered,
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
