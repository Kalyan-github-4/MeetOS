import {
  joinRequest,
  messages,
  summary,
  tasks,
  transcript,
} from "@/lib/mock-meeting"
import type { Participant } from "@/lib/types"
import { ChatPanel } from "@/components/meeting/chat-panel"
import { JoinRequest } from "@/components/meeting/join-request"
import { MeetingHeader } from "@/components/meeting/meeting-header"
import { MeetingToolbar } from "@/components/meeting/meeting-toolbar"
import { ParticipantStrip } from "@/components/meeting/participant-strip"
import { Stage } from "@/components/meeting/stage"
import { SummaryPanel } from "@/components/meeting/summary-panel"
import { TranscriptPanel } from "@/components/meeting/transcript-panel"

type MeetingRoomProps = {
  code: string
  title: string
  subtitle: string
  /** Everyone currently in the session, the first of whom takes the stage. */
  participants: Participant[]
  recording?: boolean
}

/**
 * The full meeting room screen.
 *
 * Meeting details and participants are real (Phase 3). Chat, transcript and the
 * AI summary are still placeholders — they arrive in Phases 5 and 6.
 */
export function MeetingRoom({
  code,
  title,
  subtitle,
  participants,
  recording = false,
}: MeetingRoomProps) {
  const [activeSpeaker, ...others] = participants
  return (
    <div className="flex flex-1 flex-col gap-4 bg-white p-4 lg:h-dvh lg:flex-row lg:overflow-hidden">
      {/* Meeting experience */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <MeetingHeader title={title} subtitle={subtitle} code={code} />

        <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
          <ParticipantStrip participants={others} />
          {activeSpeaker ? (
            <Stage participant={activeSpeaker} />
          ) : (
            <div className="flex min-h-72 flex-1 items-center justify-center rounded-3xl bg-muted text-sm text-muted-foreground">
              Waiting for someone to join…
            </div>
          )}
        </div>

        <JoinRequest name={joinRequest.name} avatarUrl={joinRequest.avatarUrl} />
        <TranscriptPanel segments={transcript} />
        <MeetingToolbar recording={recording} />
      </div>

      {/* Meeting intelligence */}
      <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[360px] lg:overflow-y-auto">
        <SummaryPanel summary={summary} tasks={tasks} />
        <ChatPanel
          messages={messages}
          participants={participants}
          className="min-h-96 flex-1"
        />
      </aside>
    </div>
  )
}
