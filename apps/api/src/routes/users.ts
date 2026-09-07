import type { FastifyInstance } from "fastify";

export async function userRoutes(app: FastifyInstance): Promise<void> {
  app.get("/users/me", { preHandler: app.requireAuth }, async (request) => {
    // requireAuth guarantees this is non-null.
    const user = request.user!;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };
  });
}
