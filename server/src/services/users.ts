import { eq } from "drizzle-orm";
import { createClerkClient } from "@clerk/backend";

import { env } from "../config/env.ts";
import { db } from "./db.ts";
import { users } from "../db/schema.ts";

const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

export type LocalUser = typeof users.$inferSelect;

/**
 * Resolves the local mirror row for a Clerk user, creating it on first sight.
 *
 * Syncing lazily on first authenticated request rather than through a webhook
 * keeps development working without a publicly reachable URL. Webhooks are
 * still worth adding later so that profile edits and deletions propagate.
 */
export async function resolveUser(clerkId: string): Promise<LocalUser> {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (existing[0]) return existing[0];

  const profile = await clerk.users.getUser(clerkId);
  const email =
    profile.primaryEmailAddress?.emailAddress ??
    profile.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error(`Clerk user ${clerkId} has no email address`);
  }

  const name =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    profile.username ||
    null;

  const [created] = await db
    .insert(users)
    .values({
      clerkId,
      email,
      name,
      avatarUrl: profile.imageUrl || null,
    })
    // Two concurrent first requests would otherwise race on the unique index.
    .onConflictDoUpdate({
      target: users.clerkId,
      set: { email, name, updatedAt: new Date() },
    })
    .returning();

  return created;
}
