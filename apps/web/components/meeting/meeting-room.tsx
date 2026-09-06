import {
  activeSpeaker,
  joinRequest,
  meeting,
  messages,
  participants,
  summary,
  tasks,
  transcript,
} from "@/lib/mock-meeting"
import { ChatPanel } from "@/components/meeting/chat-panel"
import { JoinRequest } from "@/components/meeting/join-request"
import { MeetingHeader } from "@/components/meeting/meeting-header"
import { MeetingToolbar } from "@/components/meeting/meeting-toolbar"
import { ParticipantStrip } from "@/components/meeting/participant-strip"
import { Stage } from "@/components/meeting/stage"
import { SummaryPanel } from "@/components/meeting/summary-panel"
import { TranscriptPanel } from "@/components/meeting/transcript-panel"

/**
 * The full meeting room screen. Rendered by both `/` and `/meeting/[code]`
 * so the layout has a single definition.
 */
export function MeetingRoom({ code }: { code: string }) {
  return (
    <div className="flex flex-1 flex-col gap-4 bg-white p-4 lg:h-dvh lg:flex-row lg:overflow-hidden">
      {/* Meeting experience */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <MeetingHeader
          title={meeting.title}
          subtitle={meeting.subtitle}
          code={code}
        />

        <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
          <ParticipantStrip participants={participants} />
          <Stage participant={activeSpeaker} />
        </div>

        <JoinRequest name={joinRequest.name} avatarUrl={joinRequest.avatarUrl} />
        <TranscriptPanel segments={transcript} />
        <MeetingToolbar recording={meeting.recording} />
      </div>

      {/* Meeting intelligence */}
      <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[360px] lg:overflow-y-auto">
        <SummaryPanel summary={summary} tasks={tasks} />
        <ChatPanel
          messages={messages}
          participants={[activeSpeaker, ...participants]}
          className="min-h-96 flex-1"
        />
      </aside>
    </div>
  )
}
