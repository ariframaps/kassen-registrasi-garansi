// scripts/reset-db.ts
import { drizzle } from "drizzle-orm/postgres-js";
import { reset } from "drizzle-seed";
import * as schema from "./schema"; // your schema file
import { seedUsers } from "./seeds/seed-users";

async function main() {
  const db = drizzle(process.env.DATABASE_URL!);
  await reset(db, schema); // TRUNCATE all tables CASCADE
  // then run your seed logic here
  await seedUsers();
  process.exit(1);
}
main();   