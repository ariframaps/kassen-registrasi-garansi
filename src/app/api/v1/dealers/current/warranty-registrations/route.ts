import { HTTP_STATUS } from "@/constants/http-status.constant";
import { db } from "@/db";
import { customer, invoice, product, purchase, purchaseItem, auditLog } from "@/db/schema";
import { errorResponse, successResponse } from "@/lib/api/api-response";
import { authenticationMiddleware, authorizationMiddleware } from "@/lib/api/auth.middleware";
import { getHttpErrorStatus } from "@/lib/api/get-http-error-status";
import { getSafeErrorMessage } from "@/lib/api/get-safe-error-message";
import { HttpError } from "@/lib/api/http-error";
import { normalizeError } from "@/lib/errors/normalize-error";
import { uploadInvoiceToDrive } from "@/lib/google-drive";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { dealers } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

const warrantyRegistrationSchema = z.object({
	selectedSNs: z.array(z.string()).min(1, "Minimal 1 produk harus dipilih"),
	customerName: z.string().min(1, "Nama customer wajib diisi"),
	phone: z.string().min(1, "No. HP wajib diisi"),
	email: z.string().email("Email tidak valid"),
	purchaseDate: z.string().date("Format tanggal tidak valid"),
});

export async function POST(req: NextRequest) {
	try {
		const session = await authenticationMiddleware();

		await authorizationMiddleware({
			allowedRole: ["dealer"],
			currentRole: session.user.role,
		});

		// Get dealer
		const dealer = await db.query.dealers.findFirst({
			where: eq(dealers.userId, session.user.id),
		});

		if (!dealer) {
			throw new HttpError("Dealer tidak ditemukan", HTTP_STATUS.NOT_FOUND.code);
		}

		// Parse FormData
		const formData = await req.formData();
		const invoiceFile = formData.get("file") as File | null;
		const selectedSNsStr = formData.get("selectedSNs") as string;
		const customerName = formData.get("customerName") as string;
		const phone = formData.get("phone") as string;
		const email = formData.get("email") as string;
		const purchaseDate = formData.get("purchaseDate") as string;

		if (!invoiceFile) {
			throw new HttpError("Invoice file wajib diunggah", HTTP_STATUS.BAD_REQUEST.code);
		}

		// Validate data
		const selectedSNs = JSON.parse(selectedSNsStr || "[]");
		const validationResult = warrantyRegistrationSchema.safeParse({
			selectedSNs,
			customerName,
			phone,
			email,
			purchaseDate,
		});

		if (!validationResult.success) {
			const issues = validationResult.error.issues.map((i) => i.message);
			throw new HttpError(issues.join(", "), HTTP_STATUS.BAD_REQUEST.code);
		}

		// Get or create customer
		let cust = await db.query.customer.findFirst({
			where: eq(customer.email, email),
		});

		if (!cust) {
			const custId = crypto.randomUUID();
			await db.insert(customer).values({
				id: custId,
				name: customerName,
				email,
				phone,
			});
			cust = await db.query.customer.findFirst({
				where: eq(customer.id, custId),
			});
		}

		if (!cust) {
			throw new HttpError("Gagal membuat/mendapatkan customer", HTTP_STATUS.INTERNAL_SERVER_ERROR.code);
		}

		// Get products and validate they exist and belong to dealer
		const products = await db.query.product.findMany({
			where: (p, { and, inArray, eq: eqFn }) =>
				and(inArray(p.serialNumber, selectedSNs), eqFn(p.dealerId, dealer.id)),
			with: { productType: true },
		});

		if (products.length !== selectedSNs.length) {
			throw new HttpError("Beberapa produk tidak ditemukan atau tidak milik dealer Anda", HTTP_STATUS.BAD_REQUEST.code);
		}

		// Check if products are already linked to a purchase
		const existingPurchaseItems = await db
			.select()
			.from(purchaseItem)
			.where(inArray(purchaseItem.productId, products.map((p) => p.id)));

		if (existingPurchaseItems.length > 0) {
			const linkedSNs = existingPurchaseItems
				.map((pi) => products.find((p) => p.id === pi.productId)?.serialNumber)
				.filter(Boolean)
				.join(", ");
			throw new HttpError(
				`Produk berikut sudah terdaftar garansi sebelumnya: ${linkedSNs}. Hubungi admin jika perlu mengubah data.`,
				HTTP_STATUS.CONFLICT.code,
			);
		}

		// Upload invoice to Google Drive
		const fileBuffer = Buffer.from(await invoiceFile.arrayBuffer());
		const invoiceLink = await uploadInvoiceToDrive(
			fileBuffer,
			invoiceFile.name,
			invoiceFile.type,
		);

		// Create purchase
		const purchaseId = crypto.randomUUID();

		await db.insert(purchase).values({
			id: purchaseId,
			purchaseDate,
			customerId: cust.id,
			dealerId: dealer.id,
			registeredBy: session.user.id,
			source: "dealer",
		});

		// Create invoice record
		const invoiceId = crypto.randomUUID();
		await db.insert(invoice).values({
			id: invoiceId,
			purchaseId: purchaseId,
			storagePath: invoiceLink,
			originalFilename: invoiceFile.name,
			mimeType: invoiceFile.type,
			fileSizeBytes: fileBuffer.length,
			uploadedBy: session.user.id,
		});

		// Link products to purchase and update warranty dates
		for (const prod of products) {
			// Link to purchase
			await db.insert(purchaseItem).values({
				id: crypto.randomUUID(),
				purchaseId,
				productId: prod.id,
			});

			// Calculate warranty end date
			const warrantyMonths = prod.productType.warrantyDurationMonths || 12;
			const startDate = new Date(purchaseDate);
			const endDate = new Date(startDate);
			endDate.setMonth(endDate.getMonth() + warrantyMonths);

			// Format dates as ISO date strings (YYYY-MM-DD)
			const startDateStr = startDate.toISOString().split("T")[0];
			const endDateStr = endDate.toISOString().split("T")[0];

			// Update product with warranty info
			await db.update(product).set({
				warrantyStartDate: startDateStr,
				warrantyEndDate: endDateStr,
				status: "warranty_active",
			}).where(eq(product.id, prod.id));
		}

		// Audit log
		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: session.user.id,
			category: "DEALER",
			event: "REGISTER_WARRANTY",
			status: "success",
			priority: "high",
			data: {
				dealerId: dealer.id,
				customerId: cust.id,
				purchaseId,
				productCount: products.length,
				serialNumbers: selectedSNs,
			},
		});

		return NextResponse.json(
			successResponse({
				message: "Garansi berhasil terdaftar",
				data: {
					purchaseId,
					customerId: cust.id,
					productsCount: products.length,
					groupId: `GRP-${customerName.slice(0, 3).toUpperCase()}-${purchaseDate.replace(/-/g, "").slice(2)}`,
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
