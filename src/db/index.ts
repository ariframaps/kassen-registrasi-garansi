import { drizzle } from "drizzle-orm/postgres-js";
import { envServer } from "@/lib/env-server";
import * as schema from "../db/schema";

export const db = drizzle(envServer.DATABASE_URL, {
	schema,
	casing: "snake_case",
});
