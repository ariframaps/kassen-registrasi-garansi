import { db } from "@/db";
import {
	otpCodes,
	OtpInsertSchema,
	OtpSchema,
	otpSelectSchema,
	OtpUpdateSchema,
} from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const otpRepository = {
	updateOtp: async ({
		findBy,
		key,
		data,
	}: {
		findBy: "userId" | "otpId";
		key: string;
		data: OtpUpdateSchema;
	}): Promise<void> => {
		const condition =
			findBy === "userId" ? eq(otpCodes.userId, key) : eq(otpCodes.id, key);
		await db.update(otpCodes).set(data).where(condition);
	},

	createOtp: async (data: OtpInsertSchema): Promise<void> => {
		await db.insert(otpCodes).values(data);
	},

	findLatestUserOtp: async ({
		findBy,
		key,
	}: {
		findBy: "userId" | "otpId";
		key: string;
	}): Promise<OtpSchema | undefined> => {
		const condition =
			findBy === "userId" ? eq(otpCodes.userId, key) : eq(otpCodes.id, key);

		const result = await db
			.select()
			.from(otpCodes)
			.where(condition)
			.orderBy(desc(otpCodes.createdAt))
			.limit(1);

		if (!result[0]) return undefined;

		const parsed = otpSelectSchema.parse(result[0]);
		return parsed;
	},
};
