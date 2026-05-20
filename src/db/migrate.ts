import config from "$/drizzle.config";
import { serverEnv } from "@/lib/env-server";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const pool = new Pool({
	connectionString: serverEnv.DATABASE_URL,
});

const db = drizzle(pool);

async function main() {
	if (config.out) {
		await migrate(db, { migrationsFolder: config.out });
		console.log("Migration done!");
	}
}

main()
	.catch((e) => {
		console.error(e);
	})
	.finally(async () => {
		await pool.end();
	});
