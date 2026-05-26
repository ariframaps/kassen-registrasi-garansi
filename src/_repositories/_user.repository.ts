// import { db } from "@/db";
// import { user, UserSchema, userSchema, UserUpdateSchema } from "@/db/schema";
// import { eq } from "drizzle-orm";

// export const userRepository = {
// 	findOneUser: async ({
// 		findBy,
// 		key,
// 	}: {
// 		findBy: "email" | "id";
// 		key: string;
// 	}): Promise<UserSchema | undefined> => {
// 		const condition =
// 			findBy === "email" ? eq(user.email, key) : eq(user.id, key);

// 		const result = await db.select().from(user).where(condition).limit(1);

// 		if (!result[0]) return undefined;

// 		const parsed = userSchema.parse(result[0]);
// 		return parsed;
// 	},

// 	// updateUser: async ({
// 	// 	findBy,
// 	// 	key,
// 	// 	data,
// 	// }: {
// 	// 	findBy: "email" | "id";
// 	// 	key: string;
// 	// 	data: UserUpdateSchema;
// 	// }): Promise<void> => {
// 	// 	const condition =
// 	// 		findBy === "email" ? eq(user.email, key) : eq(user.id, key);
// 	// 	await db.update(user).set(data).where(condition);
// 	// },
// };
