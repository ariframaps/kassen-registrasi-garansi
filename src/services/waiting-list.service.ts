import { db } from "@/db";
import { WaitingListSchema, waitingListSchema } from "@/db/schema";

export const waitingListService = {
	getAll: async (): Promise<WaitingListSchema[]> => {
		const result = await db.query.waitingList.findMany({});
		const parsed = waitingListSchema.array().parse(result);
		return parsed;
	},
};
