import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

import { verifyClerkToken } from "../services/clerk.ts";
import { verifyGuestToken, type GuestClaims } from "../services/guest.ts";
import { resolveUser, type LocalUser } from "../services/users.ts";

declare module "fastify" {
  interface FastifyRequest {
    /** The signed-in user, or null for anonymous and guest callers. */
    user: LocalUser | null;
    /** Set when the caller presented a guest meeting token instead. */
    guest: GuestClaims | null;
  }

  interface FastifyInstance {
    /** preHandler that rejects callers without a Clerk account with 401. */
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

function bearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

const authPlugin: FastifyPluginAsync = async (app) => {
  app.decorateRequest("user", null);
  app.decorateRequest("guest", null);

  // Identify every request, but reject none — routes opt into requiring auth.
  // Guest meeting access depends on anonymous requests reaching a handler
  // rather than being turned away here.
  app.addHook("onRequest", async (request) => {
    const token = bearerToken(request);
    if (!token) return;

    // Guest tokens are ours and cheap to check, so try them before paying for
    // Clerk verification.
    const guest = verifyGuestToken(token);
    if (guest) {
      request.guest = guest;
      return;
    }

    const identity = await verifyClerkToken(token);
    if (!identity) return;

    try {
      request.user = await resolveUser(identity.clerkId);
    } catch (error) {
      // A verified token whose profile cannot be mirrored is worth logging;
      // the request continues as anonymous.
      request.log.error({ err: error }, "failed to resolve Clerk user");
    }
  });

  app.decorate(
    "requireAuth",
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) {
        await reply.code(401).send({ error: "Authentication required" });
      }
    },
  );
};

export default fp(authPlugin, { name: "auth" });
