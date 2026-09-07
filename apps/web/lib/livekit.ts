const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export type MeetingToken = {
  token: string
  url: string
  room: string
  participant: { id: string; displayName: string; role: string }
}

/**
 * Exchanges this browser's seat for a LiveKit token.
 *
 * Guests authenticate with the token they were given when joining; signed-in
 * users are recognised by their Clerk session, which the API reads from the
 * Authorization header the caller supplies.
 */
export async function fetchMeetingToken(
  code: string,
  authToken: string | null,
): Promise<MeetingToken> {
  const response = await fetch(
    `${API_URL}/meetings/${encodeURIComponent(code)}/token`,
    {
      method: "POST",
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    },
  )

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string
    } | null
    throw new Error(body?.error ?? "Could not connect to the meeting.")
  }

  return (await response.json()) as MeetingToken
}
