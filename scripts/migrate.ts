import "./load-env";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "path";
import postgres from "postgres";
import * as schema from "../src/lib/db/schema";

const migrationsFolder = path.join(process.cwd(), "drizzle/migrations");

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is missing from .env");
  }

  const client = postgres(url, { prepare: false, max: 1 });
  await client`SET statement_timeout = '300000'`;

  try {
    const db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder });
    console.log("Database migrated.");
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
