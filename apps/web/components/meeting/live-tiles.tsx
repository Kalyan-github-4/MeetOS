"use client"

import { VideoTrack, type TrackReference } from "@livekit/components-react"
import { Mic01Icon, MicOff01Icon } from "@hugeicons/core-free-icons"
import { cn } from "cn"

import { Icon } from "@/components/ui/icon"
import { initials } from "@/lib/types"

export type Tile = {
  /** Participant identity — the participant row id issued at join. */
  id: string
  name: string
  isLocal: boolean
  micOn: boolean
  isSpeaking: boolean
  /** Absent when the camera is off, so the tile falls back to initials. */
  video: TrackReference | null
}

function Initials({ name, size }: { name: string; size: "sm" | "lg" }) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center bg-muted font-semibold text-muted-foreground",
        size === "lg" ? "text-5xl" : "text-xl",
      )}
    >
      {initials(name)}
    </div>
  )
}

function MicBadge({ micOn }: { micOn: boolean }) {
  return (
    <span
      title={micOn ? "Microphone on" : "Microphone muted"}
      className="inline-flex size-8 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white shadow-[0_2px_8px_rgba(0,0,0,0.25)] backdrop-blur-md"
    >
      <span className="sr-only">
        {micOn ? "Microphone on" : "Microphone muted"}
      </span>
      <Icon icon={micOn ? Mic01Icon : MicOff01Icon} size={13} strokeWidth={2} />
    </span>
  )
}

/** The large tile: the active speaker, or whoever is sharing their screen. */
export function LiveStage({
  tile,
  className,
  children,
}: {
  tile: Tile | null
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "relative isolate min-h-72 flex-1 overflow-hidden rounded-3xl bg-muted",
        className,
      )}
    >
      {tile === null ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          Waiting for someone to join…
        </div>
      ) : tile.video ? (
        <VideoTrack
          trackRef={tile.video}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <Initials name={tile.name} size="lg" />
      )}

      {tile ? (
        <>
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/55 to-transparent"
          />
          <div className="absolute top-5 left-5 z-10 text-white">
            <p className="text-[11px] font-medium tracking-wide text-white/75">
              {tile.isLocal ? "You" : "In this meeting"}
            </p>
            <p className="text-lg font-semibold tracking-tight">{tile.name}</p>
          </div>
        </>
      ) : null}

      {children}
    </div>
  )
}

/** The rail of everyone who is not on the stage. */
export function LiveParticipantStrip({ tiles }: { tiles: Tile[] }) {
  if (tiles.length === 0) return null

  return (
    <div className="flex gap-3 overflow-x-auto lg:w-44 lg:shrink-0 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto">
      {tiles.map((tile) => (
        <div
          key={tile.id}
          className={cn(
            "relative aspect-4/3 w-40 shrink-0 overflow-hidden rounded-3xl bg-muted lg:w-full",
            tile.isSpeaking && "ring-2 ring-primary",
          )}
        >
          {tile.video ? (
            <VideoTrack
              trackRef={tile.video}
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <Initials name={tile.name} size="sm" />
          )}

          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent"
          />

          <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
            <p className="min-w-0 truncate text-sm font-medium text-white">
              {tile.isLocal ? `${tile.name} (you)` : tile.name}
            </p>
            <MicBadge micOn={tile.micOn} />
          </div>
        </div>
      ))}
    </div>
  )
}
