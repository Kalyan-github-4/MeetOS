import type { TranscriptSegment } from "@/lib/mock-meeting"

export function TranscriptPanel({ segments }: { segments: TranscriptSegment[] }) {
  return (
    <section
      aria-label="Live transcript"
      // Static content for now, so nothing should be announced as it changes.
      aria-live="off"
      className="rounded-4xl bg-card px-5 py-4 shadow-sm"
    >
      <p className="text-sm leading-relaxed text-muted-foreground">
        {segments.map((segment) => (
          <span key={segment.id}>
            {segment.highlighted ? (
              <mark className="rounded bg-emerald-100 px-1 py-0.5 font-medium text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200">
                {segment.text}
              </mark>
            ) : (
              segment.text
            )}{" "}
          </span>
        ))}
      </p>
    </section>
  )
}
