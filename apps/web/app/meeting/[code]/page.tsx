import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"

import { apiFetch, ApiError } from "@/lib/api"
import { messages, summary, tasks } from "@/lib/mock-meeting"
import { ChatPanel } from "@/components/meeting/chat-panel"
import { LiveMeetingRoom } from "@/components/meeting/live-room"
import { PreJoin } from "@/components/meeting/pre-join"
import { SummaryPanel } from "@/components/meeting/summary-panel"

export const metadata: Metadata = {
  title: "Meeting Room · MeetOS",
  description: "Live meeting room with chat, transcript and AI summary.",
}

type MeetingResponse = {
  id: string
  code: string
  title: string
  status: "scheduled" | "live" | "ended"
  host: { id: string; name: string | null }
}

export default async function MeetingRoomPage({
  params,
}: PageProps<"/meeting/[code]">) {
  const { code: rawCode } = await params
  const code = decodeURIComponent(rawCode)

  let meeting: MeetingResponse
  try {
    meeting = await apiFetch<MeetingResponse>(
      `/meetings/${encodeURIComponent(code)}`,
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  }

  const user = await currentUser()
  const signedInName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null

  // Chat and the AI summary are still placeholders — Phases 5 and 6.
  const sidePanels = (
    <>
      <SummaryPanel summary={summary} tasks={tasks} />
      <ChatPanel
        messages={messages}
        participants={[]}
        className="min-h-96 flex-1"
      />
    </>
  )

  return (
    <PreJoin
      code={code}
      title={meeting.title}
      hostName={meeting.host.name}
      signedInName={signedInName}
    >
      <LiveMeetingRoom
        code={code}
        title={meeting.title}
        subtitle={
          meeting.host.name ? `${meeting.host.name}'s meeting` : "MeetOS meeting"
        }
        sidePanels={sidePanels}
      />
    </PreJoin>
  )
}
