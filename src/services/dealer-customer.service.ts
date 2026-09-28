import { HTTP_STATUS } from "@/constants/http-status.constant";
import { db } from "@/db";
import { customer, purchase } from "@/db/schema";
import { HttpError } from "@/lib/api/http-error";
import { eq } from "drizzle-orm";

interface DealerCustomerFilterParams {
	userId: string;
	search?: string;
}

interface DealerCustomerResponse {
	id: string;
	name: string;
	email: string | null;
	phone: string | null;
}

export const dealerCustomerService = {
	getDealerCustomers: async (
		params: DealerCustomerFilterParams,
	): Promise<{
		items: DealerCustomerResponse[];
		dealerId: string;
	}> => {
		// Get dealer's own customer profile (a dealer is a customer with a linked user)
		const dealer = await db.query.customer.findFirst({
			where: eq(customer.userId, params.userId),
		});

		if (!dealer) {
			throw new HttpError(
				"Dealer tidak ditemukan untuk user ini",
				HTTP_STATUS.NOT_FOUND.code,
			);
		}

		// Get all purchases registered by this dealer (purchase.customerId is always
		// the end customer; the dealer who processed it is tracked via registeredBy)
		const purchases = await db.query.purchase.findMany({
			where: eq(purchase.registeredBy, params.userId),
			with: {
				customer: true,
			},
		});

		// Extract unique customers using a Map
		const customerMap = new Map<
			string,
			{ id: string; name: string; email: string | null; phone: string | null }
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
						(c.email && c.email.toLowerCase().includes(params.search!.toLowerCase())) ||
						(c.phone && c.phone.toLowerCase().includes(params.search!.toLowerCase())),
				)
			: customers;

		return {
			items: filtered,
			dealerId: dealer.id,
		};
	},
};
