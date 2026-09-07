import { defineConfig } from "drizzle-kit";

import { env } from "./src/config/env.ts";

/**
 * Migrations run over Neon's direct endpoint, not the pooled one.
 *
 * The pooler is PgBouncer in transaction mode, which does not support the
 * session-level work a migration does — against it the DDL can apply while
 * recording the migration fails, leaving the tables created but the migration
 * table empty. Neon's direct host is the pooled host without the `-pooler`
 * suffix; the application keeps using the pooled URL.
 */
const directUrl = env.DATABASE_URL.replace("-pooler.", ".");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: directUrl,
  },
  verbose: true,
  strict: true,
});
