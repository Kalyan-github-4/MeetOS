import { eq } from "drizzle-orm";

import { closeDb, db } from "../services/db.ts";
import { meetings, meetingSessions, users } from "./schema.ts";

// A fixed code keeps /meeting/<code> stable across reseeds while developing.
const DEMO_CODE = "dev-demo-room";
const DEMO_CLERK_ID = "user_seed_demo_host";

async function seed(): Promise<void> {
  const [host] = await db
    .insert(users)
    .values({
      clerkId: DEMO_CLERK_ID,
      email: "host@meetos.dev",
      name: "Casey Host",
    })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: { name: "Casey Host", updatedAt: new Date() },
    })
    .returning();

  const [meeting] = await db
    .insert(meetings)
    .values({
      code: DEMO_CODE,
      title: "Weekly Meeting Room",
      hostId: host.id,
      status: "live",
    })
    .onConflictDoUpdate({
      target: meetings.code,
      set: { hostId: host.id, updatedAt: new Date() },
    })
    .returning();

  const existingSession = await db
    .select()
    .from(meetingSessions)
    .where(eq(meetingSessions.meetingId, meeting.id))
    .limit(1);

  const session =
    existingSession[0] ??
    (
      await db
        .insert(meetingSessions)
        .values({
          meetingId: meeting.id,
          livekitRoom: `meetos-${meeting.code}`,
        })
        .returning()
    )[0];

  console.log("Seeded:");
  console.log(`  host      ${host.email} (${host.id})`);
  console.log(`  meeting   ${meeting.code} (${meeting.id})`);
  console.log(`  session   ${session.livekitRoom} (${session.id})`);
  console.log(`\n  http://localhost:3000/meeting/${meeting.code}`);
}

try {
  await seed();
} catch (error) {
  console.error("Seed failed:", error);
  process.exitCode = 1;
} finally {
  await closeDb();
}
