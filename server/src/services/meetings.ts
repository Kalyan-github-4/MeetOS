import { and, count, desc, eq, isNull } from "drizzle-orm";

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
export type ParticipantStatus = Participant["status"];

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
  status: ParticipantStatus;
}): Promise<Participant> {
  const [participant] = await db
    .insert(participants)
    .values(input)
    .returning();

  return participant;
}

/** Who is in the call — admitted and not yet gone. */
export async function listActiveParticipants(
  sessionId: string,
): Promise<Participant[]> {
  return db
    .select()
    .from(participants)
    .where(
      and(
        eq(participants.sessionId, sessionId),
        eq(participants.status, "admitted"),
        isNull(participants.leftAt),
      ),
    )
    .orderBy(participants.joinedAt);
}

/** Who is knocking, longest-waiting first — the order the host sees them in. */
export async function listWaitingParticipants(
  sessionId: string,
): Promise<Participant[]> {
  return db
    .select()
    .from(participants)
    .where(
      and(
        eq(participants.sessionId, sessionId),
        eq(participants.status, "waiting"),
        isNull(participants.leftAt),
      ),
    )
    .orderBy(participants.joinedAt);
}

/**
 * Moves someone through the door. `removed` also stamps `leftAt`, since they
 * are no longer in the call; `denied` does not, so the person turned away can
 * still be told so when they next ask — their seat is otherwise dead.
 */
export async function setParticipantStatus(
  participantId: string,
  status: ParticipantStatus,
): Promise<void> {
  await db
    .update(participants)
    .set(status === "removed" ? { status, leftAt: new Date() } : { status })
    .where(eq(participants.id, participantId));
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
    // Asking again after being turned away creates a new seat; the newest one
    // is the one that counts.
    .orderBy(desc(participants.joinedAt))
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

export async function countActiveParticipants(
  sessionId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(participants)
    .where(
      and(
        eq(participants.sessionId, sessionId),
        eq(participants.status, "admitted"),
        isNull(participants.leftAt),
      ),
    );

  return row?.count ?? 0;
}

/**
 * Closes one session and marks its meeting ended.
 *
 * Reached when the last participant leaves, which is the common way a call
 * actually finishes — hosts close the tab far more often than they press End.
 * Without this a session would stay open forever and its chat would never be
 * cleaned up.
 */
export async function endSession(session: MeetingSession): Promise<void> {
  const now = new Date();

  await db
    .update(meetingSessions)
    .set({ endedAt: now })
    .where(
      and(eq(meetingSessions.id, session.id), isNull(meetingSessions.endedAt)),
    );

  await db
    .update(meetings)
    .set({ status: "ended", updatedAt: now })
    .where(eq(meetings.id, session.meetingId));
}

/** The sessions a meeting still has open, needed before they are closed. */
export async function listOpenSessions(
  meetingId: string,
): Promise<MeetingSession[]> {
  return db
    .select()
    .from(meetingSessions)
    .where(
      and(
        eq(meetingSessions.meetingId, meetingId),
        isNull(meetingSessions.endedAt),
      ),
    );
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
