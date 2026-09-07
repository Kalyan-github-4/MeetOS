import { drizzle } from "drizzle-orm/postgres-js";
import { sql as raw } from "drizzle-orm";
import postgres from "postgres";

import { env } from "../config/env.ts";
import * as schema from "../db/schema.ts";

// Neon is accessed through its pooler, so keep this client small — the pooler,
// not us, is what fans out to the database.
const client = postgres(env.DATABASE_URL, { max: 5 });

export const db = drizzle(client, { schema });

export async function pingDb(): Promise<void> {
  await db.execute(raw`select 1`);
}

export async function closeDb(): Promise<void> {
  await client.end();
}
