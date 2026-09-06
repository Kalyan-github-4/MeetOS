import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const triggerClassName =
  "rounded-4xl px-4 data-active:bg-primary data-active:text-primary-foreground dark:data-active:bg-primary dark:data-active:text-primary-foreground dark:data-active:border-transparent"

type SummaryPanelProps = {
  summary: string
  tasks: { id: string; label: string; owner: string }[]
}

export function SummaryPanel({ summary, tasks }: SummaryPanelProps) {
  return (
    <section
      aria-label="Meeting intelligence"
      className="rounded-4xl bg-card p-4 shadow-sm"
    >
      <Tabs defaultValue="summary" className="gap-4">
        <TabsList className="self-start">
          <TabsTrigger value="tasks" className={triggerClassName}>
            List Task
          </TabsTrigger>
          <TabsTrigger value="summary" className={triggerClassName}>
            Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <ul className="flex flex-col gap-3">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-start gap-2.5">
                <span
                  aria-hidden
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-foreground/30"
                />
                <span className="min-w-0">
                  <span className="block text-sm leading-snug">{task.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {task.owner}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="summary">
          <p className="text-sm leading-relaxed text-muted-foreground">{summary}</p>
        </TabsContent>
      </Tabs>
    </section>
  )
}
