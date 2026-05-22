import { db } from "@/db";
import {
	users,
	UserSchema,
	userSelectSchema,
	UserUpdateSchema,
} from "@/db/schema";
import { eq } from "drizzle-orm";

export const userRepository = {
	findOneUser: async ({
		findBy,
		key,
	}: {
		findBy: "email" | "id";
		key: string;
	}): Promise<UserSchema | undefined> => {
		const condition =
			findBy === "email" ? eq(users.email, key) : eq(users.id, key);

		const result = await db.select().from(users).where(condition).limit(1);

		if (!result[0]) return undefined;

		const parsed = userSelectSchema.parse(result[0]);
		return parsed;
	},

	updateUser: async ({
		findBy,
		key,
		data,
	}: {
		findBy: "email" | "id";
		key: string;
		data: UserUpdateSchema;
	}): Promise<void> => {
		const condition =
			findBy === "email" ? eq(users.email, key) : eq(users.id, key);
		await db.update(users).set(data).where(condition);
	},
};
