import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { env } from "../config/env.ts";

import { issueGuestToken } from "../services/guest.ts";
import { createMeetingToken } from "../services/livekit.ts";
import {
  addParticipant,
  createMeeting,
  endMeeting,
  findActiveParticipantForUser,
  findParticipantById,
  getMeetingByCode,
  getOrCreateActiveSession,
  listActiveParticipants,
  listMeetingsForHost,
  markParticipantLeft,
} from "../services/meetings.ts";

const createBody = z.object({
  // Optional: starting a meeting should be one click. A title can be added
  // later; until then the host's name stands in.
  title: z.string().trim().min(1).max(120).optional(),
  scheduledAt: z.coerce.date().optional(),
});

const joinBody = z.object({
  displayName: z.string().trim().min(1).max(60).optional(),
});

/** Used when a host starts a meeting without naming it. */
function defaultTitle(hostName: string | null): string {
  const first = hostName?.trim().split(/\s+/)[0];
  return first ? `${first}'s meeting` : "Instant meeting";
}

const codeParams = z.object({
  code: z.string().trim().min(1).max(40),
});

function publicMeeting(meeting: Awaited<ReturnType<typeof getMeetingByCode>>) {
  if (!meeting) return null;
  return {
    id: meeting.id,
    code: meeting.code,
    title: meeting.title,
    status: meeting.status,
    scheduledAt: meeting.scheduledAt,
    host: { id: meeting.host.id, name: meeting.host.name },
  };
}

export async function meetingRoutes(app: FastifyInstance): Promise<void> {
  app.post("/meetings", { preHandler: app.requireAuth }, async (request, reply) => {
    const parsed = createBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid request", issues: parsed.error.issues });
    }

    const meeting = await createMeeting({
      hostId: request.user!.id,
      title: parsed.data.title ?? defaultTitle(request.user!.name),
      scheduledAt: parsed.data.scheduledAt ?? null,
    });

    return reply.code(201).send({
      id: meeting.id,
      code: meeting.code,
      title: meeting.title,
      status: meeting.status,
      scheduledAt: meeting.scheduledAt,
      createdAt: meeting.createdAt,
    });
  });

  app.get("/meetings", { preHandler: app.requireAuth }, async (request) => {
    const meetings = await listMeetingsForHost(request.user!.id);
    return { meetings };
  });

  // Public so the pre-join screen can show what a guest is about to join.
  app.get("/meetings/:code", async (request, reply) => {
    const params = codeParams.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: "Invalid code" });

    const meeting = await getMeetingByCode(params.data.code);
    if (!meeting) return reply.code(404).send({ error: "Meeting not found" });

    return publicMeeting(meeting);
  });

  app.post("/meetings/:code/join", async (request, reply) => {
    const params = codeParams.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: "Invalid code" });

    const body = joinBody.safeParse(request.body ?? {});
    if (!body.success) {
      return reply.code(400).send({ error: "Invalid request", issues: body.error.issues });
    }

    const meeting = await getMeetingByCode(params.data.code);
    if (!meeting) return reply.code(404).send({ error: "Meeting not found" });
    if (meeting.status === "ended") {
      return reply.code(409).send({ error: "This meeting has ended" });
    }

    const user = request.user;
    const displayName = user?.name ?? body.data.displayName ?? null;
    if (!displayName) {
      // A guest has no profile to fall back on.
      return reply.code(400).send({ error: "displayName is required for guests" });
    }

    const session = await getOrCreateActiveSession(meeting);
    const participant = await addParticipant({
      sessionId: session.id,
      userId: user?.id ?? null,
      displayName,
      role: user && user.id === meeting.hostId ? "host" : "guest",
    });

    return reply.code(201).send({
      meeting: publicMeeting(meeting),
      session: { id: session.id, livekitRoom: session.livekitRoom },
      participant: {
        id: participant.id,
        displayName: participant.displayName,
        role: participant.role,
      },
      // Guests get a token so a reload keeps them as the same participant.
      guestToken: user
        ? null
        : issueGuestToken({ participantId: participant.id, sessionId: session.id }),
    });
  });

  /**
   * Issues the LiveKit token that actually admits someone to the call.
   *
   * The caller proves who they are with a Clerk or guest token; the participant
   * row is then re-read from the database rather than trusted from the request,
   * so a token can only ever grant the seat it was issued for.
   */
  app.post("/meetings/:code/token", async (request, reply) => {
    const params = codeParams.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: "Invalid code" });

    const meeting = await getMeetingByCode(params.data.code);
    if (!meeting) return reply.code(404).send({ error: "Meeting not found" });
    if (meeting.status === "ended") {
      return reply.code(409).send({ error: "This meeting has ended" });
    }

    const session = await getOrCreateActiveSession(meeting);

    const participant = request.guest
      ? await findParticipantById(request.guest.participantId)
      : request.user
        ? await findActiveParticipantForUser(session.id, request.user.id)
        : null;

    if (!participant) {
      return reply.code(403).send({ error: "Join the meeting first" });
    }

    // A token for one session must not open another.
    if (participant.sessionId !== session.id) {
      return reply.code(403).send({ error: "That seat is for a previous session" });
    }

    if (participant.leftAt) {
      return reply.code(403).send({ error: "You have left this meeting" });
    }

    const token = await createMeetingToken({
      room: session.livekitRoom,
      identity: participant.id,
      displayName: participant.displayName,
      canPublish: true,
    });

    return {
      token,
      url: env.LIVEKIT_URL,
      room: session.livekitRoom,
      participant: {
        id: participant.id,
        displayName: participant.displayName,
        role: participant.role,
      },
    };
  });

  app.get("/meetings/:code/participants", async (request, reply) => {
    const params = codeParams.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: "Invalid code" });

    const meeting = await getMeetingByCode(params.data.code);
    if (!meeting) return reply.code(404).send({ error: "Meeting not found" });

    const session = await getOrCreateActiveSession(meeting);
    const active = await listActiveParticipants(session.id);

    return {
      participants: active.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        role: p.role,
        joinedAt: p.joinedAt,
      })),
    };
  });

  app.post("/meetings/:code/leave", async (request, reply) => {
    const params = codeParams.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: "Invalid code" });

    // Who is leaving comes from the caller's own token, never from the body —
    // otherwise anyone could evict anyone else by guessing a participant id.
    if (request.guest) {
      await markParticipantLeft(request.guest.participantId);
      return reply.code(204).send();
    }

    if (!request.user) {
      return reply.code(401).send({ error: "Authentication required" });
    }

    const meeting = await getMeetingByCode(params.data.code);
    if (!meeting) return reply.code(404).send({ error: "Meeting not found" });

    const session = await getOrCreateActiveSession(meeting);
    const participant = await findActiveParticipantForUser(
      session.id,
      request.user.id,
    );

    if (!participant) {
      return reply.code(404).send({ error: "You are not in this meeting" });
    }

    await markParticipantLeft(participant.id);
    return reply.code(204).send();
  });

  app.post("/meetings/:code/end", { preHandler: app.requireAuth }, async (request, reply) => {
    const params = codeParams.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: "Invalid code" });

    const meeting = await getMeetingByCode(params.data.code);
    if (!meeting) return reply.code(404).send({ error: "Meeting not found" });

    // Only the host may end a meeting for everyone.
    if (meeting.hostId !== request.user!.id) {
      return reply.code(403).send({ error: "Only the host can end this meeting" });
    }

    await endMeeting(meeting.id);
    return reply.code(204).send();
  });
}
