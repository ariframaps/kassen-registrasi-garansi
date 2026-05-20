import { drizzle } from "drizzle-orm/postgres-js";
import { serverEnv } from "@/lib/env-server";
import * as schema from "../db/schema";

export const db = drizzle(serverEnv.DATABASE_URL, {
	schema,
	casing: "snake_case",
});
