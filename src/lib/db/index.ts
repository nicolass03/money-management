import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Database = PostgresJsDatabase<typeof schema>;

let client: ReturnType<typeof postgres> | undefined;
let database: Database | undefined;

function getDatabase(): Database {
  if (database) {
    return database;
  }

  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL is missing from .env. Use the Supabase Postgres connection string.",
    );
  }

  client = postgres(url, { prepare: false });
  database = drizzle(client, { schema });
  return database;
}

export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    return Reflect.get(getDatabase(), prop, receiver);
  },
});

export async function closeDb() {
  if (client) {
    await client.end({ timeout: 5 });
    client = undefined;
    database = undefined;
  }
}
