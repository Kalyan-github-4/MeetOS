import type { Metadata } from "next"

import { MeetingRoom } from "@/components/meeting/meeting-room"

export const metadata: Metadata = {
  title: "Meeting Room · MeetOS",
  description: "Live meeting room with chat, transcript and AI summary.",
}

export default async function MeetingRoomPage({
  params,
}: PageProps<"/meeting/[code]">) {
  const { code } = await params

  return <MeetingRoom code={decodeURIComponent(code)} />
}
