import { Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"

type JoinRequestProps = {
  name: string
  avatarUrl: string
}

export function JoinRequest({ name, avatarUrl }: JoinRequestProps) {
  return (
    <div className="flex items-center gap-3 rounded-4xl bg-card px-3 py-2 shadow-sm">
      <Avatar size="sm">
        <AvatarImage src={avatarUrl} alt="" />
        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
      </Avatar>

      <p className="min-w-0 flex-1 truncate text-sm">
        <span className="font-medium">{name}</span>
        <span className="text-muted-foreground"> wants to join the meeting</span>
      </p>

      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Deny ${name}`}
        className="text-destructive hover:bg-destructive/10"
      >
        <Icon icon={Cancel01Icon} size={16} strokeWidth={2} />
      </Button>
      <Button size="icon-sm" aria-label={`Admit ${name}`}>
        <Icon icon={Tick02Icon} size={16} strokeWidth={2} />
      </Button>
    </div>
  )
}
