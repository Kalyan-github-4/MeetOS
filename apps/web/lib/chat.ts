/**
 * Chat transport and persistence.
 *
 * Messages travel over LiveKit's data channel, which is what makes them appear
 * instantly, and are stored through the API only so that someone joining late
 * can catch up. The two paths are independent: if the store call fails the
 * conversation is unaffected, it just will not be replayed to a late joiner.
 *
 * A plain module rather than a hook file: it is imported by a "use client"
 * component, and keeping non-component exports out of client entries is what
 * keeps them reachable.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

/** The data-channel topic chat rides on. Other features get their own. */
export const CHAT_TOPIC = "chat"

/** One message as it travels between browsers. */
export type ChatEnvelope = {
  id: string
  authorId: string
  authorName: string
  body: string
  sentAt: string
}

type StoredMessage = {
  id: string
  authorId: string | null
  authorName: string
  body: string
  sentAt: string
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export function encodeChat(message: ChatEnvelope): Uint8Array {
  return encoder.encode(JSON.stringify(message))
}

/**
 * Reads a message off the wire, returning null for anything malformed.
 *
 * Payloads come from other browsers, so every field is checked rather than
 * assumed — a bad frame should drop a message, not break the panel.
 */
export function decodeChat(payload: Uint8Array): ChatEnvelope | null {
  try {
    const parsed = JSON.parse(decoder.decode(payload)) as Partial<ChatEnvelope>
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.authorId !== "string" ||
      typeof parsed.authorName !== "string" ||
      typeof parsed.body !== "string" ||
      typeof parsed.sentAt !== "string"
    ) {
      return null
    }

    return {
      id: parsed.id,
      authorId: parsed.authorId,
      authorName: parsed.authorName,
      body: parsed.body,
      sentAt: parsed.sentAt,
    }
  } catch {
    return null
  }
}

function authHeaders(authToken: string | null): HeadersInit {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {}
}

/** The conversation so far, for a browser that has just joined or reloaded. */
export async function fetchChatBacklog(
  code: string,
  authToken: string | null,
): Promise<ChatEnvelope[]> {
  const response = await fetch(
    `${API_URL}/meetings/${encodeURIComponent(code)}/messages`,
    { headers: authHeaders(authToken) },
  )

  if (!response.ok) throw new Error("Could not load the chat history.")

  const { messages } = (await response.json()) as { messages: StoredMessage[] }

  return messages.map((message) => ({
    id: message.id,
    authorId: message.authorId ?? "",
    authorName: message.authorName,
    body: message.body,
    sentAt: message.sentAt,
  }))
}

/**
 * Stores a message that has already been sent over the data channel.
 *
 * The id is the sender's, so the stored row and the delivered copy share a key
 * and a late joiner merging the two sees each message once.
 */
export async function persistChatMessage(
  code: string,
  authToken: string | null,
  message: { id: string; body: string },
): Promise<void> {
  const response = await fetch(
    `${API_URL}/meetings/${encodeURIComponent(code)}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(authToken) },
      body: JSON.stringify(message),
    },
  )

  if (!response.ok) throw new Error("Message was not saved to the history.")
}

/** Clock time beside a message, in the reader's locale. */
export function formatSentAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""

  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })
}
