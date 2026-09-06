import {
  RecordIcon,
  Settings01Icon,
  SubtitleIcon,
  TextFontIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Separator } from "@/components/ui/separator"

// Fixed heights (percent) so server and client render identically.
const WAVEFORM = [
  22, 46, 30, 68, 40, 88, 54, 34, 72, 26, 58, 100, 44, 62, 28, 80, 36, 52, 24,
  66, 42, 90, 32, 56, 20, 74, 38, 60,
]

function Waveform() {
  return (
    <div
      aria-hidden
      className="flex h-7 flex-1 items-center justify-center gap-[3px] overflow-hidden"
    >
      {WAVEFORM.map((height, index) => (
        <span
          key={index}
          style={{ height: `${height}%` }}
          className="w-[3px] shrink-0 rounded-full bg-foreground/25"
        />
      ))}
    </div>
  )
}

export function MeetingToolbar({ recording }: { recording: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-4xl bg-card px-3 py-2.5 shadow-sm">
      <div className="flex items-center gap-1 rounded-4xl bg-muted p-[3px]">
        <Button size="sm" className="rounded-4xl">
          Transcription
        </Button>
        <Button variant="ghost" size="sm" className="rounded-4xl text-muted-foreground">
          <Icon icon={SubtitleIcon} size={15} strokeWidth={1.8} />
          Subtitle
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Caption text size"
        className="text-muted-foreground"
      >
        <Icon icon={TextFontIcon} size={16} strokeWidth={1.8} />
      </Button>

      <Separator orientation="vertical" className="hidden h-6 sm:block" />

      <Waveform />

      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium",
          recording ? "text-destructive" : "text-muted-foreground"
        )}
      >
        <Icon icon={RecordIcon} size={14} strokeWidth={2.4} />
        <span className="sr-only sm:not-sr-only">
          {recording ? "Recording" : "Not recording"}
        </span>
      </span>

      <Button size="icon" aria-label="Meeting settings">
        <Icon icon={Settings01Icon} size={17} strokeWidth={1.8} />
      </Button>
    </div>
  )
}
