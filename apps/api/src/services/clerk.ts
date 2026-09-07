import { verifyToken } from "@clerk/backend";

import { env } from "../config/env.ts";

export type ClerkIdentity = {
  clerkId: string;
  sessionId: string | undefined;
};

/**
 * Verifies a Clerk session JWT. Clerk fetches and caches the JWKS internally,
 * so this stays a network call only on key rotation.
 */
export async function verifyClerkToken(
  token: string,
): Promise<ClerkIdentity | null> {
  try {
    const claims = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
    });

    return { clerkId: claims.sub, sessionId: claims.sid };
  } catch {
    // An unverifiable token is an anonymous request, not a server error.
    return null;
  }
}
