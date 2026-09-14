import { Redis } from "ioredis";

import { env } from "../config/env.ts";

/** How many times a single connection attempt is retried before giving up. */
const CONNECT_ATTEMPTS = 3;

// Nothing depends on Redis: LiveKit Cloud carries presence and chat, so this
// stays null unless REDIS_URL is set. It returns if rate limiting or cross-node
// fan-out ever needs it.
export const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL, {
      // Fail health checks loudly instead of queueing commands forever behind
      // a dead connection.
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      // Stop rather than reconnect forever. Without this an unreachable Redis
      // floods the log with a refused connection several times a second, which
      // buries everything else the API has to say.
      retryStrategy: (attempt) =>
        attempt > CONNECT_ATTEMPTS ? null : Math.min(attempt * 200, 1000),
    })
  : null;

// ioredis reports a connection error as an *unhandled* error event unless
// something is listening, which turns one dead dependency into a stack trace
// per attempt. The health check is what actually reports Redis being down.
redis?.on("error", () => {});

export function isRedisConfigured(): boolean {
  return redis !== null;
}

export async function pingRedis(): Promise<void> {
  if (!redis) throw new Error("REDIS_URL is not configured");

  // "end" means a previous attempt gave up; anything mid-flight must not be
  // connected a second time.
  if (redis.status === "end" || redis.status === "wait") await redis.connect();
  if (redis.status !== "ready") throw new Error("Redis is not connected");

  await redis.ping();
}

export async function closeRedis(): Promise<void> {
  await redis?.quit();
}
