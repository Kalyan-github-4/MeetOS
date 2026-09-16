import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "../config/env.ts";

export type GuestClaims = {
  participantId: string;
  sessionId: string;
  exp: number;
};

const TTL_SECONDS = 60 * 60 * 12;

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(payload: string): string {
  return b64url(createHmac("sha256", env.AUTH_SECRET).update(payload).digest());
}

/**
 * Issues a signed token identifying a guest participant.
 *
 * Guests have no Clerk account, so this is what lets them keep speaking as the
 * same participant across reloads without being able to claim someone else's
 * seat — the participant id is bound by the signature.
 */
export function issueGuestToken(input: {
  participantId: string;
  sessionId: string;
}): string {
  const claims: GuestClaims = {
    participantId: input.participantId,
    sessionId: input.sessionId,
    exp: Math.floor(Date.now() / 1000) + TTL_SECONDS,
  };

  const payload = b64url(JSON.stringify(claims));
  return `${payload}.${sign(payload)}`;
}

export function verifyGuestToken(token: string): GuestClaims | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as GuestClaims;

    if (claims.exp * 1000 < Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}
