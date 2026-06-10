import "./load-env";
import { closeDb } from "../src/lib/db";
import { seedDatabase } from "../src/lib/db/seed";

async function main() {
  try {
    const seeded = await seedDatabase();
    if (seeded) {
      console.log("Database seeded with sample data.");
    } else {
      console.log("Seed skipped: database already contains data.");
    }
  } finally {
    await closeDb();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
