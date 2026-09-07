import Fastify from "fastify";
import cors from "@fastify/cors";

import { env } from "./config/env.ts";
import authPlugin from "./plugins/auth.ts";
import { healthRoutes } from "./routes/health.ts";
import { meetingRoutes } from "./routes/meetings.ts";
import { userRoutes } from "./routes/users.ts";
import { closeDb } from "./services/db.ts";
import { closeRedis } from "./services/redis.ts";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
  credentials: true,
});

await app.register(authPlugin);

await app.register(healthRoutes);
await app.register(userRoutes);
await app.register(meetingRoutes);

app.addHook("onClose", async () => {
  await Promise.allSettled([closeDb(), closeRedis()]);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    app.close().then(
      () => process.exit(0),
      () => process.exit(1),
    );
  });
}

try {
  await app.listen({
    port: env.PORT,
    host: "0.0.0.0",
  });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
