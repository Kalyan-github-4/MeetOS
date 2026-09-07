"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import { useAuth } from "@clerk/nextjs"
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useParticipants,
  useTracks,
} from "@livekit/components-react"
import { Track } from "livekit-client"

import { fetchMeetingToken, type MeetingToken } from "@/lib/livekit"
import { clearParticipant, readParticipant } from "@/lib/meeting-seat"
import { LiveControls } from "@/components/meeting/live-controls"
import {
  LiveParticipantStrip,
  LiveStage,
  type Tile,
} from "@/components/meeting/live-tiles"
import { MeetingHeader } from "@/components/meeting/meeting-header"

/**
 * Builds the tiles shown on stage and in the strip.
 *
 * A screen share takes the stage when present — that is what people are looking
 * at — otherwise the first remote camera does, falling back to the local one so
 * a lone participant still sees themselves.
 */
function useTiles(): { stage: Tile | null; strip: Tile[] } {
  const participants = useParticipants()
  const tracks = useTracks(
    [Track.Source.Camera, Track.Source.ScreenShare],
    { onlySubscribed: false },
  )

  const cameraFor = (identity: string) =>
    tracks.find(
      (t) =>
        t.participant.identity === identity &&
        t.source === Track.Source.Camera &&
        t.publication?.isSubscribed !== false &&
        !t.publication?.isMuted,
    ) ?? null

  const tiles: Tile[] = participants.map((p) => ({
    id: p.identity,
    name: p.name || p.identity,
    isLocal: p.isLocal,
    micOn: p.isMicrophoneEnabled,
    isSpeaking: p.isSpeaking,
    video: cameraFor(p.identity),
  }))

  const screenShare = tracks.find((t) => t.source === Track.Source.ScreenShare)
  if (screenShare) {
    const owner = tiles.find(
      (t) => t.id === screenShare.participant.identity,
    )
    return {
      stage: {
        id: `${screenShare.participant.identity}-screen`,
        name: `${owner?.name ?? "Someone"} — screen`,
        isLocal: screenShare.participant.isLocal,
        micOn: owner?.micOn ?? false,
        isSpeaking: false,
        video: screenShare,
      },
      strip: tiles,
    }
  }

  const speaking = tiles.find((t) => t.isSpeaking && !t.isLocal)
  const remote = tiles.find((t) => !t.isLocal)
  const stage = speaking ?? remote ?? tiles[0] ?? null

  return { stage, strip: tiles.filter((t) => t.id !== stage?.id) }
}

function RoomLayout({
  code,
  title,
  subtitle,
  sidePanels,
  onLeave,
}: {
  code: string
  title: string
  subtitle: string
  sidePanels: ReactNode
  onLeave: () => void
}) {
  const { stage, strip } = useTiles()
  const { isMicrophoneEnabled } = useLocalParticipant()

  return (
    <div className="flex flex-1 flex-col gap-4 bg-white p-4 lg:h-dvh lg:flex-row lg:overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <MeetingHeader title={title} subtitle={subtitle} code={code} />

        <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
          <LiveParticipantStrip tiles={strip} />
          <LiveStage tile={stage}>
            <LiveControls onLeave={onLeave} />
          </LiveStage>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {isMicrophoneEnabled ? "Your mic is on" : "Your mic is muted"}
        </p>
      </div>

      <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[360px] lg:overflow-y-auto">
        {sidePanels}
      </aside>

      {/* Plays every remote audio track; without it the room is silent. */}
      <RoomAudioRenderer />
    </div>
  )
}

export function LiveMeetingRoom({
  code,
  title,
  subtitle,
  sidePanels,
}: {
  code: string
  title: string
  subtitle: string
  sidePanels: ReactNode
}) {
  const { getToken, isLoaded } = useAuth()
  const [connection, setConnection] = useState<MeetingToken | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return
    let cancelled = false

    async function connect() {
      try {
        // A guest presents the token issued at join; a signed-in user is
        // recognised by their Clerk session.
        const guestToken = readParticipant(code)?.guestToken ?? null
        const authToken = guestToken ?? (await getToken())
        const result = await fetchMeetingToken(code, authToken)
        if (!cancelled) setConnection(result)
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error ? cause.message : "Could not connect.",
          )
        }
      }
    }

    void connect()
    return () => {
      cancelled = true
    }
  }, [code, getToken, isLoaded])

  const handleLeave = useCallback(() => {
    clearParticipant(code)
  }, [code])

  if (error) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-sm rounded-2xl border p-6 text-center">
          <p className="font-medium">Could not join the meeting</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
      </main>
    )
  }

  if (!connection) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <div
          aria-hidden
          className="h-64 w-full max-w-3xl animate-pulse rounded-3xl bg-muted"
        />
        <span className="sr-only">Connecting to the meeting…</span>
      </main>
    )
  }

  return (
    <LiveKitRoom
      token={connection.token}
      serverUrl={connection.url}
      connect
      video={false}
      audio
      onDisconnected={handleLeave}
      className="flex flex-1 flex-col"
    >
      <RoomLayout
        code={code}
        title={title}
        subtitle={subtitle}
        sidePanels={sidePanels}
        onLeave={handleLeave}
      />
    </LiveKitRoom>
  )
}
