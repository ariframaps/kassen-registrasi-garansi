import { db } from "@/db";
import { dealerSchema, DealerSchema } from "@/db/schema";

export const dealerService = {
	getAll: async (): Promise<DealerSchema[]> => {
		const result = await db.query.dealers.findMany({});
		const parsed = dealerSchema.array().parse(result);
		return parsed;
	},
};
