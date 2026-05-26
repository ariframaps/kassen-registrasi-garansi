import { db } from "@/db";
import { userSchema, UserSchema } from "@/db/schema";

export const userService = {
	getAll: async (): Promise<UserSchema[]> => {
		const result = await db.query.user.findMany({});
		const parsed = userSchema.array().parse(result);
		return parsed;
	},
};
