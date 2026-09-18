import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"

import { Sunburst } from "@/components/marketing/sunburst"

/** What the product already does — no roadmap promises in the shop window. */
const capabilities = [
  { name: "Video & audio", detail: "One click to join. Nothing to install." },
  { name: "Screen share", detail: "A share takes the stage automatically." },
  { name: "Room chat", detail: "Live, and replayed for late joiners." },
]

function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      className={className}
    >
      <path d="M5 11 11 5M6 5h5v5" />
    </svg>
  )
}

export default async function Home() {
  const { userId } = await auth()
  if (userId) redirect("/dashboard")

  return (
    // One viewport, deliberately. Nothing below the fold to scroll toward yet.
    <main className="relative flex h-dvh flex-col overflow-hidden bg-canvas text-ink">
      <header className="flex shrink-0 items-center gap-2.5 border-b border-hairline px-6 py-5 lg:px-14">
        <span className="size-1.5 rounded-full bg-ember" />
        <span className="text-sm font-medium tracking-tight">MeetUp</span>
      </header>

      <div className="relative flex min-h-0 flex-1 items-center px-6 lg:px-14">
        {/* Anchored to the corner and allowed to run off two edges, so it reads
            as a window onto something larger rather than a placed graphic. */}
        <Sunburst className="pointer-events-none absolute -bottom-88 -left-40 w-160 opacity-[0.55] lg:-bottom-104 lg:w-208" />

        <div className="relative flex w-full items-center justify-between gap-16">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2.5 text-xs tracking-[0.18em] text-ink-muted uppercase">
              <span className="size-2 rounded-full border border-ember" />
              Video meetings
            </p>

            <h1 className="mt-8 text-[clamp(2.75rem,7.5vw,6rem)] leading-[0.94] font-medium tracking-[-0.035em] text-balance">
              Meetings that keep working after the call.
            </h1>

            <p className="mt-7 max-w-md text-base leading-relaxed text-ink-muted">
              Start a room and share the link. Guests join in the browser — no
              download, no account.
            </p>

            <div className="mt-11 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link
                href="/sign-up"
                className="rounded-full bg-ink px-7 py-3.5 text-sm font-medium text-canvas transition-opacity hover:opacity-85"
              >
                Start a meeting
              </Link>

              <Link
                href="/sign-in"
                className="group flex items-center gap-3 text-sm font-medium underline-offset-4 hover:underline"
              >
                Sign in
                <span className="flex size-8 items-center justify-center rounded-full border border-hairline transition-colors group-hover:border-ink">
                  <ArrowUpRight className="size-3.5" />
                </span>
              </Link>
            </div>
          </div>

          {/* Quiet supporting column, in the spirit of the reference's card
              grid. Dropped on small screens rather than stacked — the hero owes
              the viewport exactly one screen. */}
          <ul className="hidden w-80 shrink-0 flex-col gap-3 xl:flex">
            {capabilities.map((capability) => (
              <li
                key={capability.name}
                className="rounded-xl border border-hairline p-5"
              >
                <p className="text-sm font-medium">{capability.name}</p>
                <p className="mt-1.5 text-sm leading-snug text-ink-muted">
                  {capability.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  )
}
