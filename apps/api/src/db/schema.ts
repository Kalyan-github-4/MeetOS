import { relations } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const meetingStatus = pgEnum("meeting_status", [
  "scheduled",
  "live",
  "ended",
]);

export const participantRole = pgEnum("participant_role", [
  "host",
  "cohost",
  "guest",
]);

/**
 * Identity lives in Clerk. This table is the local mirror that meetings can
 * hold a foreign key to, kept in sync by Clerk webhooks — it is deliberately
 * not the source of truth for credentials.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkId: text("clerk_id").notNull(),
    email: text("email").notNull(),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("users_clerk_id_idx").on(table.clerkId)],
);

/** The durable meeting record — the thing a shareable link points at. */
export const meetings = pgTable(
  "meetings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    title: text("title").notNull(),
    hostId: uuid("host_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Null means an instant meeting rather than a scheduled one.
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    status: meetingStatus("status").notNull().default("scheduled"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("meetings_code_idx").on(table.code),
    index("meetings_host_id_idx").on(table.hostId),
  ],
);

/**
 * One row per time a meeting actually runs. Separating this from `meetings`
 * means a recurring meeting keeps each run's participants, chat and (later)
 * transcript distinct instead of merging them under one link.
 */
export const meetingSessions = pgTable(
  "meeting_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    meetingId: uuid("meeting_id")
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    livekitRoom: text("livekit_room").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
  },
  (table) => [
    index("meeting_sessions_meeting_id_idx").on(table.meetingId),
    uniqueIndex("meeting_sessions_livekit_room_idx").on(table.livekitRoom),
  ],
);

/**
 * A person inside one session. `userId` is null for guests, who are identified
 * only by the display name they typed on the pre-join screen.
 */
export const participants = pgTable(
  "participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => meetingSessions.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    displayName: text("display_name").notNull(),
    role: participantRole("role").notNull().default("guest"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    leftAt: timestamp("left_at", { withTimezone: true }),
  },
  (table) => [
    index("participants_session_id_idx").on(table.sessionId),
    index("participants_user_id_idx").on(table.userId),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => meetingSessions.id, { onDelete: "cascade" }),
    // Kept when a participant row is removed so chat history stays readable.
    participantId: uuid("participant_id").references(() => participants.id, {
      onDelete: "set null",
    }),
    authorName: text("author_name").notNull(),
    body: text("body").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("messages_session_id_sent_at_idx").on(table.sessionId, table.sentAt)],
);

export const usersRelations = relations(users, ({ many }) => ({
  hostedMeetings: many(meetings),
  participations: many(participants),
}));

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  host: one(users, { fields: [meetings.hostId], references: [users.id] }),
  sessions: many(meetingSessions),
}));

export const meetingSessionsRelations = relations(
  meetingSessions,
  ({ one, many }) => ({
    meeting: one(meetings, {
      fields: [meetingSessions.meetingId],
      references: [meetings.id],
    }),
    participants: many(participants),
    messages: many(messages),
  }),
);

export const participantsRelations = relations(participants, ({ one, many }) => ({
  session: one(meetingSessions, {
    fields: [participants.sessionId],
    references: [meetingSessions.id],
  }),
  user: one(users, { fields: [participants.userId], references: [users.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  session: one(meetingSessions, {
    fields: [messages.sessionId],
    references: [meetingSessions.id],
  }),
  participant: one(participants, {
    fields: [messages.participantId],
    references: [participants.id],
  }),
}));
