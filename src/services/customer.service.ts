import { HTTP_STATUS } from "@/constants/http-status.constant";
import { db } from "@/db";
import {
	auditLog,
	customer,
	customerSchema,
	CustomerSchema,
	purchase,
	purchaseItem,
	product,
	invoice,
	dealers,
} from "@/db/schema";
import { HttpError } from "@/lib/api/http-error";
import { eq } from "drizzle-orm";
import z from "zod";
import type { PurchaseGroup } from "@/types";
import type { Customer } from "@/types";

export const updateCustomerSchema = z.object({
	name: z.string().min(1, "Nama wajib diisi"),
	email: z.string().email("Format email tidak valid"),
	phone: z
		.string()
		.max(50)
		.nullable()
		.optional()
		.transform((v) => (v === "" ? null : v)),
	address: z
		.string()
		.nullable()
		.optional()
		.transform((v) => (v === "" ? null : v)),
});
export type UpdateCustomerPayload = z.infer<typeof updateCustomerSchema>;

interface AuditContext {
	userId: string;
	ipAddress?: string | null;
	userAgent?: string | null;
}

export const customerService = {
	getAll: async (): Promise<CustomerSchema[]> => {
		const result = await db.query.customer.findMany({});
		return customerSchema.array().parse(result);
	},

	getById: async (id: string): Promise<CustomerSchema> => {
		const result = await db.query.customer.findFirst({
			where: eq(customer.id, id),
		});
		if (!result)
			throw new HttpError(
				"Customer tidak ditemukan",
				HTTP_STATUS.NOT_FOUND.code,
			);
		return customerSchema.parse(result);
	},

	getPurchaseHistory: async (customerId: string): Promise<PurchaseGroup[]> => {
		const result = await db.query.purchase.findMany({
			where: eq(purchase.customerId, customerId),
			with: {
				dealer: true,
				items: {
					with: {
						product: true,
					},
				},
				invoice: true,
			},
			orderBy: (purchase, { desc }) => [desc(purchase.purchaseDate)],
		});

		return result.map((p) => {
			const warrantyDates = p.items
				.map((item) => {
					const endDate = item.product.warrantyEndDate;
					if (!endDate) return null;
					return typeof endDate === "string" ? endDate : endDate.toISOString().split("T")[0];
				})
				.filter((date) => date != null);

			const latestWarrantyDate = warrantyDates.length > 0
				? warrantyDates.reduce((max, current) => (current > max ? current : max))
				: new Date().toISOString().split("T")[0];

			return {
				id: p.id,
				serialNumbers: p.items.map((item) => item.product.serialNumber),
				dealerName: p.dealer?.name ?? null,
				dealerId: p.dealerId ?? undefined,
				purchaseDate: p.purchaseDate,
				warrantyEndDate: latestWarrantyDate,
				invoiceUrl: p.invoice?.storagePath ?? null,
				invoiceFileName: p.invoice?.originalFilename ?? null,
				registeredById: p.registeredBy,
				registeredAt: p.createdAt.toISOString(),
				notes: p.notes ?? undefined,
			};
		}) as PurchaseGroup[];
	},

	getCustomerDetail: async (customerId: string): Promise<{
		customer: Customer;
		dealers: string[];
		totalPurchases: number;
	}> => {
		const cust = await db.query.customer.findFirst({
			where: eq(customer.id, customerId),
		});

		if (!cust)
			throw new HttpError(
				"Customer tidak ditemukan",
				HTTP_STATUS.NOT_FOUND.code,
			);

		const purchases = await db.query.purchase.findMany({
			where: eq(purchase.customerId, customerId),
			with: { dealer: true },
		});

		const dealerSet = new Set<string>();
		purchases.forEach((p) => {
			if (p.dealer?.name) dealerSet.add(p.dealer.name);
		});

		return {
			customer: {
				id: cust.id,
				name: cust.name,
				email: cust.email,
				phone: cust.phone ?? "",
				address: cust.address ?? "",
				created_at: cust.createdAt.toISOString(),
				updated_at: cust.updatedAt.toISOString(),
			},
			dealers: Array.from(dealerSet),
			totalPurchases: purchases.length,
		};
	},

	update: async (
		id: string,
		data: UpdateCustomerPayload,
		audit: AuditContext,
	): Promise<CustomerSchema> => {
		const existing = await db.query.customer.findFirst({
			where: eq(customer.id, id),
		});
		if (!existing)
			throw new HttpError(
				"Customer tidak ditemukan",
				HTTP_STATUS.NOT_FOUND.code,
			);

		const result = await db
			.update(customer)
			.set({
				name: data.name,
				email: data.email,
				phone: data.phone ?? null,
				address: data.address ?? null,
				updatedAt: new Date(),
			})
			.where(eq(customer.id, id))
			.returning();

		if (!result[0])
			throw new HttpError(
				"Gagal memperbarui customer",
				HTTP_STATUS.BAD_GATEWAY.code,
			);

		const parsed = customerSchema.parse(result[0]);

		await db.insert(auditLog).values({
			id: crypto.randomUUID(),
			userId: audit.userId,
			category: "PURCHASE",
			event: "CUSTOMER_UPDATED",
			status: "success",
			priority: "medium",
			ipAddress: audit.ipAddress ?? undefined,
			userAgent: audit.userAgent ?? undefined,
			data: { customerId: id, name: data.name, email: data.email },
		});

		return parsed;
	},
};
