import type { FastifyInstance } from "fastify";

import { pingDb } from "../services/db.ts";
import { isRedisConfigured, pingRedis } from "../services/redis.ts";

type DependencyStatus = "up" | "down" | "not_configured";

async function probe(check: () => Promise<unknown>): Promise<DependencyStatus> {
  try {
    await check();
    return "up";
  } catch {
    return "down";
  }
}

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async (_request, reply) => {
    const [database, cache] = await Promise.all([
      probe(pingDb),
      isRedisConfigured()
        ? probe(pingRedis)
        : Promise.resolve<DependencyStatus>("not_configured"),
    ]);

    const dependencies = { database, cache };
    // An unconfigured dependency is not a failure; a configured one that is
    // unreachable is.
    const healthy = Object.values(dependencies).every((s) => s !== "down");

    reply.code(healthy ? 200 : 503);

    return {
      status: healthy ? "ok" : "degraded",
      service: "MeetOS API",
      dependencies,
    };
  });
}
