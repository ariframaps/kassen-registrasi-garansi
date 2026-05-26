import { db } from "@/db";
import { customerSchema, CustomerSchema } from "@/db/schema";

export const customerService = {
	getAll: async (): Promise<CustomerSchema[]> => {
		const result = await db.query.dealers.findMany({});
		const parsed = customerSchema.array().parse(result);
		return parsed;
	},
};
