/**
 * Shapes the meeting UI renders. These live apart from `mock-meeting.ts` so the
 * placeholder data can be deleted without taking the component contracts with
 * it.
 */

export type Participant = {
  id: string
  name: string
  role: string
  /** Absent until a profile picture is known — the UI falls back to initials. */
  avatarUrl?: string
  micOn: boolean
  cameraOn: boolean
  isSpeaking: boolean
}

export type ChatMessage = {
  id: string
  authorId: string
  authorName: string
  avatarUrl?: string
  body: string
  link?: { label: string; href: string }
  sentAt: string
  isSelf: boolean
}

export type TranscriptSegment = {
  id: string
  text: string
  highlighted?: boolean
}

/** First letters of a name, used wherever an avatar image is missing. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("")
}
