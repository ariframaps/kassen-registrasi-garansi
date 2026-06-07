import { HTTP_STATUS } from "@/constants/http-status.constant";
import { db } from "@/db";
import {
	DealerInsertSchema,
	dealers,
	dealerSchema,
	DealerSchema,
} from "@/db/schema";
import { HttpError } from "@/lib/api/http-error";

export const dealerService = {
	getAll: async (): Promise<DealerSchema[]> => {
		const result = await db.query.dealers.findMany({});
		const parsed = dealerSchema.array().parse(result);
		return parsed;
	},

	add: async (data: DealerInsertSchema): Promise<DealerSchema> => {
		const result = await db.insert(dealers).values(data).returning();
		if (!result[0])
			throw new HttpError(
				"Gagal menambahkan dealer",
				HTTP_STATUS.BAD_GATEWAY.code,
			);

		const parsed = dealerSchema.parse(result[0]);
		return parsed;
	},
};
