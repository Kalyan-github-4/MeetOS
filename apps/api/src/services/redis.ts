import { Redis } from "ioredis";

import { env } from "../config/env.ts";

// Nothing depends on Redis until the real-time layer lands (Phase 4), so the
// API stays usable when REDIS_URL is unset instead of failing to boot.
export const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL, {
      // Fail health checks loudly instead of queueing commands forever behind
      // a dead connection.
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    })
  : null;

export function isRedisConfigured(): boolean {
  return redis !== null;
}

export async function pingRedis(): Promise<void> {
  if (!redis) throw new Error("REDIS_URL is not configured");
  if (redis.status !== "ready") await redis.connect();
  await redis.ping();
}

export async function closeRedis(): Promise<void> {
  await redis?.quit();
}
