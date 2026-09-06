import Image from "next/image"
import { cn } from "cn"

import type { Participant } from "@/lib/mock-meeting"
import { StageControls } from "@/components/meeting/stage-controls"

type StageProps = {
  participant: Participant
  className?: string
}

export function Stage({ participant, className }: StageProps) {
  return (
    <div
      className={cn(
        "relative isolate min-h-72 flex-1 overflow-hidden rounded-3xl bg-muted",
        className
      )}
    >
      <Image
        src={participant.avatarUrl}
        alt={participant.name}
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 60vw"
        className="object-cover"
      />

      {/* Legibility scrim behind the name overlay */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/55 to-transparent"
      />

      <div className="absolute top-5 left-5 z-10 text-white">
        <p className="text-[11px] font-medium tracking-wide text-white/75">
          {participant.role}
        </p>
        <p className="text-lg font-semibold tracking-tight">{participant.name}</p>
      </div>

      <StageControls />
    </div>
  )
}
