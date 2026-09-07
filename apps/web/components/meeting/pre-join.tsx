"use client"

import { useState, useSyncExternalStore, type ReactNode } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  readParticipant,
  saveParticipant,
  subscribeToSeat,
} from "@/lib/meeting-seat"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

/**
 * `unknown` covers server rendering and hydration, when localStorage has not
 * been read yet — it is what keeps the skeleton on screen instead of briefly
 * flashing the join form at someone who has already joined.
 */
type JoinStatus = "unknown" | "joined" | "new"

function useJoinStatus(code: string): JoinStatus {
  return useSyncExternalStore<JoinStatus>(
    subscribeToSeat,
    // Returns a string literal, so repeated calls stay referentially equal.
    () => (readParticipant(code) !== null ? "joined" : "new"),
    () => "unknown",
  )
}

/**
 * Gate in front of the meeting room.
 *
 * The room itself is server-rendered and handed in as `children`, so the gate
 * decides only whether this browser has joined yet — it never re-renders the
 * meeting on the client.
 */
export function PreJoin({
  code,
  title,
  hostName,
  signedInName,
  children,
}: {
  code: string
  title: string
  hostName: string | null
  signedInName: string | null
  children: ReactNode
}) {
  const router = useRouter()
  const status = useJoinStatus(code)
  const [name, setName] = useState(signedInName ?? "")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function join() {
    const displayName = name.trim()
    if (!displayName) {
      setError("Please enter a name so people know who joined.")
      return
    }

    setPending(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/meetings/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null
        throw new Error(body?.error ?? "Could not join this meeting.")
      }

      const result = (await response.json()) as {
        participant: { id: string; displayName: string }
        guestToken: string | null
      }

      saveParticipant(code, {
        participantId: result.participant.id,
        displayName: result.participant.displayName,
        guestToken: result.guestToken,
      })
      // Pull the participant list that now includes us.
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not join.")
    } finally {
      setPending(false)
    }
  }

  // Server-rendered and mid-hydration: show a placeholder rather than flashing
  // the page blank or showing the wrong screen.
  if (status === "unknown") {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <div
          aria-hidden
          className="h-64 w-full max-w-sm animate-pulse rounded-2xl bg-muted"
        />
        <span className="sr-only">Loading meeting…</span>
      </main>
    )
  }

  if (status === "joined") return <>{children}</>

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border p-6">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {hostName ? `Hosted by ${hostName}` : "Ready when you are"}
        </p>

        <label htmlFor="display-name" className="mt-6 block text-sm font-medium">
          Your name
        </label>
        <Input
          id="display-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void join()
          }}
          placeholder="e.g. Alex Rivera"
          className="mt-2"
          autoFocus
        />

        {error ? (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {error}
          </p>
        ) : null}

        <Button onClick={() => void join()} disabled={pending} className="mt-4 w-full">
          {pending ? "Joining…" : "Join meeting"}
        </Button>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          No account needed to join.
        </p>
      </div>
    </main>
  )
}
