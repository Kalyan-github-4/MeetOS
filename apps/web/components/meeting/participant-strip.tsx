import Image from "next/image"
import {
  Mic01Icon,
  MicOff01Icon,
  Video01Icon,
  VideoOffIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "cn"

import type { Participant } from "@/lib/mock-meeting"
import { Icon } from "@/components/ui/icon"

function StateBadge({
  on,
  onIcon,
  offIcon,
  label,
}: {
  on: boolean
  onIcon: typeof Mic01Icon
  offIcon: typeof Mic01Icon
  label: string
}) {
  return (
    <span
      title={label}
      className={cn(
        "inline-flex size-8 items-center justify-center",
        "rounded-full",
        "bg-black/45",
        "text-white",
        "backdrop-blur-md",
        "border border-white/15",
        "shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
      )}
    >
      <span className="sr-only">{label}</span>

      <Icon
        icon={on ? onIcon : offIcon}
        size={13}
        strokeWidth={2}
      />
    </span>
  )
}

function ParticipantTile({ participant }: { participant: Participant }) {
  return (
    <div className="relative aspect-4/3 w-40 shrink-0 overflow-hidden rounded-3xl bg-muted lg:w-full">
      <Image
        src={participant.avatarUrl}
        alt={participant.name}
        fill
        sizes="200px"
        className="object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent"
      />

      <div className="absolute bottom-2.5 left-3 z-10 text-white">
        <p className="text-[10px] leading-tight text-white/70">{participant.role}</p>
        <p className="text-xs font-semibold">{participant.name}</p>
      </div>

      <div className="absolute right-2.5 bottom-2.5 z-10 flex flex-col gap-1">
        <StateBadge
          on={participant.micOn}
          onIcon={Mic01Icon}
          offIcon={MicOff01Icon}
          label={`${participant.name} microphone ${participant.micOn ? "on" : "muted"
            }`}
        />

        <StateBadge
          on={participant.cameraOn}
          onIcon={Video01Icon}
          offIcon={VideoOffIcon}
          label={`${participant.name} camera ${participant.cameraOn ? "on" : "off"
            }`}
        />
      </div>
    </div>
  )
}

export function ParticipantStrip({
  participants,
  className,
}: {
  participants: Participant[]
  className?: string
}) {
  return (
    <ul
      aria-label="Participants"
      className={cn(
        "flex gap-3 overflow-x-auto pb-1 lg:w-44 lg:shrink-0 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:pb-0",
        className
      )}
    >
      {participants.map((participant) => (
        <li key={participant.id} className="lg:w-full">
          <ParticipantTile participant={participant} />
        </li>
      ))}
    </ul>
  )
}
