"use client"

import { VideoTrack, type TrackReference } from "@livekit/components-react"
import { Mic01Icon, MicOff01Icon } from "@hugeicons/core-free-icons"
import { cn } from "cn"

import { Icon } from "@/components/ui/icon"
import { ModelAvatar } from "@/components/meeting/model-avatar"

export type Tile = {
  /** Participant identity — the participant row id issued at join. */
  id: string
  name: string
  isLocal: boolean
  micOn: boolean
  isSpeaking: boolean
  /** The stand-in they picked, or null to derive one from their id. */
  avatar: number | null
  /** Absent when the camera is off, so the tile falls back to their figure. */
  video: TrackReference | null
}

/** Stands in for the camera feed, filling the tile the way video would. */
function CameraOff({ tile }: { tile: Tile }) {
  return (
    <ModelAvatar
      id={tile.id}
      name={tile.name}
      index={tile.avatar ?? undefined}
      className="absolute inset-0 size-full object-cover"
    />
  )
}

/**
 * Badges and labels that sit over video keep their own dark treatment — a
 * hairline would vanish against whatever the camera happens to be pointing at.
 */
function MicBadge({ micOn }: { micOn: boolean }) {
  return (
    <span
      title={micOn ? "Microphone on" : "Microphone muted"}
      className="inline-flex size-7 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md"
    >
      <span className="sr-only">
        {micOn ? "Microphone on" : "Microphone muted"}
      </span>
      <Icon icon={micOn ? Mic01Icon : MicOff01Icon} size={12} strokeWidth={2} />
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
        "relative isolate min-h-72 flex-1 overflow-hidden rounded-2xl border border-hairline bg-ink/3",
        className,
      )}
    >
      {tile === null ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-muted">
          Waiting for someone to join…
        </div>
      ) : tile.video ? (
        <VideoTrack
          trackRef={tile.video}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <CameraOff tile={tile} />
      )}

      {tile ? (
        <>
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-28 bg-linear-to-b from-black/45 to-transparent"
          />
          <div className="absolute top-5 left-5 z-10 text-white">
            <p className="text-[10px] tracking-[0.18em] text-white/70 uppercase">
              {tile.isLocal ? "You" : "Speaking"}
            </p>
            <p className="mt-1 text-lg font-medium tracking-tight">
              {tile.name}
            </p>
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
            "relative aspect-4/3 w-40 shrink-0 overflow-hidden rounded-xl border bg-ink/3 lg:w-full",
            // The accent marks who is talking — the one thing in the room that
            // changes on its own and is worth the eye being pulled to.
            tile.isSpeaking ? "border-ember" : "border-hairline",
          )}
        >
          {tile.video ? (
            <VideoTrack
              trackRef={tile.video}
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <CameraOff tile={tile} />
          )}

          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-14 bg-linear-to-t from-black/55 to-transparent"
          />

          <div className="absolute inset-x-3 bottom-2.5 flex items-end justify-between gap-2">
            <p className="min-w-0 truncate text-xs font-medium text-white">
              {tile.isLocal ? `${tile.name} (you)` : tile.name}
            </p>
            <MicBadge micOn={tile.micOn} />
          </div>
        </div>
      ))}
    </div>
  )
}
