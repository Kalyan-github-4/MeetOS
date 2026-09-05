import Fastify from "fastify";
import cors from "@fastify/cors";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
});

app.get("/health", async () => {
  return {
    status: "ok",
    service: "MeetOS API",
  };
});

const PORT = 4000;

try {
  await app.listen({
    port: PORT,
    host: "0.0.0.0",
  });

  console.log(`MeetOS API running on http://localhost:${PORT}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}