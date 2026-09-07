import { fileURLToPath } from "node:url";
import { z } from "zod";

// In development the API is started from a shell that has no env of its own, so
// load apps/api/.env. In production the platform injects the variables and no
// file exists — a missing file is not an error, a malformed one is.
const envFile = fileURLToPath(new URL("../../.env", import.meta.url));

try {
  process.loadEnvFile(envFile);
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.url().startsWith("postgres"),
  // Optional until the real-time layer needs it (Phase 4). Absent means the
  // API runs without Redis rather than refusing to start.
  REDIS_URL: z.url().startsWith("redis").optional(),
  LIVEKIT_URL: z.url().startsWith("ws"),
  LIVEKIT_API_KEY: z.string().min(1),
  LIVEKIT_API_SECRET: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
});

export type Env = z.infer<typeof schema>;

/**
 * Narrows on the success branch and declares the return type, so `env` is
 * unambiguously `Env` for every consumer. Relying on `process.exit()` being
 * inferred as `never` left it typed `Env | undefined` in some editors.
 */
function loadEnv(): Env {
  const parsed = schema.safeParse(process.env);

  if (parsed.success) return parsed.data;

  // Fail before anything opens a connection, and name every missing key at once
  // rather than one per restart.
  console.error("Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  }

  process.exit(1);
}

export const env = loadEnv();
