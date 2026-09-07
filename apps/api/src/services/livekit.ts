import { AccessToken } from "livekit-server-sdk";

import { env } from "../config/env.ts";

const TOKEN_TTL = "2h";

/**
 * Mints a LiveKit access token scoped to a single room.
 *
 * The grant is deliberately narrow: a token names exactly one room, so it can
 * never be replayed against another meeting. `identity` must be the caller's
 * participant id — LiveKit treats it as the unique key for a seat, and reusing
 * one disconnects the earlier holder.
 */
export async function createMeetingToken(input: {
  room: string;
  identity: string;
  displayName: string;
  canPublish: boolean;
}): Promise<string> {
  const token = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
    identity: input.identity,
    name: input.displayName,
    ttl: TOKEN_TTL,
  });

  token.addGrant({
    room: input.room,
    roomJoin: true,
    canPublish: input.canPublish,
    canSubscribe: true,
    // Used for chat and reactions over LiveKit's data channel (Phase 5).
    canPublishData: true,
  });

  return token.toJwt();
}
