import { HTTP_STATUS } from "@/constants/http-status.constant";
import { db } from "@/db";
import { dealers, purchase, customer } from "@/db/schema";
import { HttpError } from "@/lib/api/http-error";
import { eq } from "drizzle-orm";

interface DealerCustomerFilterParams {
	userId: string;
	search?: string;
}

interface DealerCustomerResponse {
	id: string;
	name: string;
	email: string;
	phone: string | null;
}

export const dealerCustomerService = {
	getDealerCustomers: async (
		params: DealerCustomerFilterParams,
	): Promise<{
		items: DealerCustomerResponse[];
		dealerId: string;
	}> => {
		// Get dealer by userId
		const dealer = await db.query.dealers.findFirst({
			where: eq(dealers.userId, params.userId),
		});

		if (!dealer) {
			throw new HttpError(
				"Dealer tidak ditemukan untuk user ini",
				HTTP_STATUS.NOT_FOUND.code,
			);
		}

		// Get all purchases for this dealer
		const purchases = await db.query.purchase.findMany({
			where: eq(purchase.dealerId, dealer.id),
			with: {
				customer: true,
			},
		});

		// Extract unique customers using a Map
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

		// Apply search filter if provided
		const filtered = params.search
			? customers.filter(
					(c) =>
						c.name.toLowerCase().includes(params.search!.toLowerCase()) ||
						c.email.toLowerCase().includes(params.search!.toLowerCase()) ||
						(c.phone && c.phone.toLowerCase().includes(params.search!.toLowerCase())),
				)
			: customers;

		return {
			items: filtered,
			dealerId: dealer.id,
		};
	},
};
