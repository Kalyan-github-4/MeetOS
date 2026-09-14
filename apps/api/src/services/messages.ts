import { asc, eq } from "drizzle-orm";

import { db } from "./db.ts";
import { messages } from "../db/schema.ts";

export type Message = typeof messages.$inferSelect;

/**
 * Persists one chat message.
 *
 * The id comes from the sender so that the row and the copy already delivered
 * over LiveKit's data channel share a key — that is what lets a late joiner
 * merge the stored backlog with live messages without showing duplicates. A
 * repeated id is ignored rather than rejected, so a client retrying a failed
 * POST cannot double-post.
 */
export async function createMessage(input: {
  id: string;
  sessionId: string;
  participantId: string;
  authorName: string;
  body: string;
}): Promise<Message | null> {
  const [created] = await db
    .insert(messages)
    .values({
      id: input.id,
      sessionId: input.sessionId,
      participantId: input.participantId,
      authorName: input.authorName,
      body: input.body,
    })
    .onConflictDoNothing({ target: messages.id })
    .returning();

  return created ?? null;
}

export async function listMessagesForSession(
  sessionId: string,
): Promise<Message[]> {
  return db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(asc(messages.sentAt));
}

/**
 * Drops a session's chat once the meeting is over.
 *
 * Chat is deliberately not kept beyond the call. When Phase 6 lands, anything
 * that needs to read the log — an AI summary, action items — has to run before
 * this is called; keeping the deletion in one place is what makes that
 * reordering a single-line change.
 */
export async function purgeMessagesForSession(sessionId: string): Promise<void> {
  await db.delete(messages).where(eq(messages.sessionId, sessionId));
}
