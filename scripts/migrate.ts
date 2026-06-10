import "./load-env";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "path";
import { closeDb, db } from "../src/lib/db";

const migrationsFolder = path.join(process.cwd(), "drizzle/migrations");

async function main() {
  try {
    await migrate(db, { migrationsFolder });
    console.log("Database migrated.");
  } finally {
    await closeDb();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
