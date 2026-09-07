import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "./db.ts";
import { generateMeetingCode } from "../lib/code.ts";
import {
  meetings,
  meetingSessions,
  participants,
  users,
} from "../db/schema.ts";

export type Meeting = typeof meetings.$inferSelect;
export type MeetingSession = typeof meetingSessions.$inferSelect;
export type Participant = typeof participants.$inferSelect;

const CODE_ATTEMPTS = 5;

export async function createMeeting(input: {
  hostId: string;
  title: string;
  scheduledAt?: Date | null;
}): Promise<Meeting> {
  // Codes are random rather than sequential, so a collision is rare but not
  // impossible — retry instead of surfacing a unique-violation to the caller.
  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt += 1) {
    const [created] = await db
      .insert(meetings)
      .values({
        code: generateMeetingCode(),
        title: input.title,
        hostId: input.hostId,
        scheduledAt: input.scheduledAt ?? null,
        status: input.scheduledAt ? "scheduled" : "live",
      })
      .onConflictDoNothing({ target: meetings.code })
      .returning();

    if (created) return created;
  }

  throw new Error("Could not allocate a unique meeting code");
}

export type MeetingWithHost = Meeting & {
  host: { id: string; name: string | null; email: string };
};

export async function getMeetingByCode(
  code: string,
): Promise<MeetingWithHost | null> {
  const rows = await db
    .select({
      meeting: meetings,
      host: { id: users.id, name: users.name, email: users.email },
    })
    .from(meetings)
    .innerJoin(users, eq(meetings.hostId, users.id))
    .where(eq(meetings.code, code))
    .limit(1);

  if (!rows[0]) return null;
  return { ...rows[0].meeting, host: rows[0].host };
}

export async function listMeetingsForHost(hostId: string): Promise<Meeting[]> {
  return db
    .select()
    .from(meetings)
    .where(eq(meetings.hostId, hostId))
    .orderBy(desc(meetings.createdAt));
}

/**
 * Returns the meeting's open session, starting one if the meeting is not
 * currently running. Each run gets its own LiveKit room so a rejoin after the
 * host ends the call does not land in the previous conversation.
 */
export async function getOrCreateActiveSession(
  meeting: Meeting,
): Promise<MeetingSession> {
  const open = await db
    .select()
    .from(meetingSessions)
    .where(
      and(
        eq(meetingSessions.meetingId, meeting.id),
        isNull(meetingSessions.endedAt),
      ),
    )
    .limit(1);

  if (open[0]) return open[0];

  const [session] = await db
    .insert(meetingSessions)
    .values({
      meetingId: meeting.id,
      livekitRoom: `meetos-${meeting.code}-${crypto.randomUUID().slice(0, 8)}`,
    })
    .returning();

  if (meeting.status !== "live") {
    await db
      .update(meetings)
      .set({ status: "live", updatedAt: new Date() })
      .where(eq(meetings.id, meeting.id));
  }

  return session;
}

export async function addParticipant(input: {
  sessionId: string;
  userId: string | null;
  displayName: string;
  role: "host" | "cohost" | "guest";
}): Promise<Participant> {
  const [participant] = await db
    .insert(participants)
    .values(input)
    .returning();

  return participant;
}

export async function listActiveParticipants(
  sessionId: string,
): Promise<Participant[]> {
  return db
    .select()
    .from(participants)
    .where(
      and(
        eq(participants.sessionId, sessionId),
        isNull(participants.leftAt),
      ),
    )
    .orderBy(participants.joinedAt);
}

export async function findActiveParticipantForUser(
  sessionId: string,
  userId: string,
): Promise<Participant | null> {
  const rows = await db
    .select()
    .from(participants)
    .where(
      and(
        eq(participants.sessionId, sessionId),
        eq(participants.userId, userId),
        isNull(participants.leftAt),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function findParticipantById(
  participantId: string,
): Promise<Participant | null> {
  const rows = await db
    .select()
    .from(participants)
    .where(eq(participants.id, participantId))
    .limit(1);

  return rows[0] ?? null;
}

export async function markParticipantLeft(participantId: string): Promise<void> {
  await db
    .update(participants)
    .set({ leftAt: new Date() })
    .where(eq(participants.id, participantId));
}

export async function endMeeting(meetingId: string): Promise<void> {
  const now = new Date();

  await db
    .update(meetingSessions)
    .set({ endedAt: now })
    .where(
      and(
        eq(meetingSessions.meetingId, meetingId),
        isNull(meetingSessions.endedAt),
      ),
    );

  await db
    .update(meetings)
    .set({ status: "ended", updatedAt: now })
    .where(eq(meetings.id, meetingId));
}
