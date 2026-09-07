import type { Metadata } from "next"
import Link from "next/link"
import { UserButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"

import { apiFetch } from "@/lib/api"
import { CreateMeetingForm } from "@/app/(app)/dashboard/create-meeting-form"

export const metadata: Metadata = {
  title: "Dashboard · MeetOS",
}

type MeetingsResponse = {
  meetings: {
    id: string
    code: string
    title: string
    status: "scheduled" | "live" | "ended"
    createdAt: string
  }[]
}

const statusStyles: Record<string, string> = {
  live: "bg-green-100 text-green-800",
  scheduled: "bg-blue-100 text-blue-800",
  ended: "bg-neutral-100 text-neutral-600",
}

export default async function DashboardPage() {
  // The group layout also protects this route, but layouts and pages render in
  // parallel — without this the fetch below would still fire (and fail) on the
  // way to the redirect. Guard the data, not just the path.
  await auth.protect()

  const { meetings } = await apiFetch<MeetingsResponse>("/meetings")

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Meetings</h1>
          <p className="text-sm text-muted-foreground">
            Start a meeting and share the link.
          </p>
        </div>
        <UserButton />
      </header>

      <CreateMeetingForm />

      {meetings.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No meetings yet. Your first one will show up here.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {meetings.map((meeting) => (
            <li key={meeting.id}>
              <Link
                href={`/meeting/${meeting.code}`}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {meeting.title}
                  </span>
                  <span className="block font-mono text-xs text-muted-foreground">
                    {meeting.code}
                  </span>
                </span>

                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    statusStyles[meeting.status] ?? statusStyles.ended
                  }`}
                >
                  {meeting.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
