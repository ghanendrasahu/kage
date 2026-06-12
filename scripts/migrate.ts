import { config } from "dotenv";
config({ path: "../.env" });

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const connection = postgres(databaseUrl);
  const db = drizzle(connection);

  console.log("Running migrations...");

  try {
    await migrate(db, { migrationsFolder: "../packages/db/migrations" });
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
