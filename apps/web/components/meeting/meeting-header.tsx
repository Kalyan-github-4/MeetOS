import {
  ArrowLeft01Icon,
  GridViewIcon,
  LayoutListIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "cn"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"

type MeetingHeaderProps = {
  title: string
  subtitle: string
  code: string
  className?: string
}

export function MeetingHeader({
  title,
  subtitle,
  code,
  className,
}: MeetingHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center gap-3 rounded-full bg-muted px-3 py-2",
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        aria-label="Back to dashboard"
        className="size-12 shrink-0 rounded-full bg-card"
      >
        <Icon icon={ArrowLeft01Icon} size={21} strokeWidth={1.8} />
      </Button>

      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-tight">
          {title}
        </h1>

        <p className="truncate text-xs text-muted-foreground">
          {subtitle}
        </p>
      </div>

      <Badge
        variant="outline"
        className="hidden font-mono tracking-wide sm:inline-flex"
      >
        {code}
      </Badge>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Grid view"
          className="size-12 shrink-0 rounded-full bg-card"
        >
          <Icon icon={GridViewIcon} size={21} strokeWidth={1.8} />
        </Button>

        <Button
          size="icon"
          aria-label="Speaker view"
          aria-pressed="true"
          className="size-12 shrink-0 rounded-full"
        >
          <Icon icon={LayoutListIcon} size={21} strokeWidth={1.8} />
        </Button>
      </div>
    </header>
  )
}