import { SentIcon, SmileIcon } from "@hugeicons/core-free-icons"
import { cn } from "cn"

import type { ChatMessage, Participant } from "@/lib/mock-meeting"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const triggerClassName =
  "rounded-4xl px-4 data-active:bg-primary data-active:text-primary-foreground dark:data-active:bg-primary dark:data-active:text-primary-foreground dark:data-active:border-transparent"

function Message({ message }: { message: ChatMessage }) {
  return (
    <li
      className={cn(
        "flex items-end gap-2",
        message.isSelf && "flex-row-reverse"
      )}
    >
      <Avatar size="sm" className="mb-0.5">
        <AvatarImage src={message.avatarUrl} alt="" />
        <AvatarFallback>{message.authorName.charAt(0)}</AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "max-w-[80%] rounded-3xl px-3.5 py-2.5",
          message.isSelf
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        <p className="text-sm leading-snug">{message.body}</p>
        {message.link ? (
          <a
            href={message.link.href}
            className="mt-1 block text-xs break-all text-blue-600 underline underline-offset-2 dark:text-blue-400"
          >
            {message.link.label}
          </a>
        ) : null}
        <p
          className={cn(
            "mt-1 text-[10px]",
            message.isSelf ? "text-primary-foreground/60" : "text-muted-foreground"
          )}
        >
          {message.sentAt}
        </p>
      </div>
    </li>
  )
}

type ChatPanelProps = {
  messages: ChatMessage[]
  participants: Participant[]
  className?: string
}

export function ChatPanel({ messages, participants, className }: ChatPanelProps) {
  return (
    <section
      aria-label="Room chat"
      className={cn("flex flex-col rounded-4xl bg-card p-4 shadow-sm", className)}
    >
      <Tabs defaultValue="chat" className="min-h-0 flex-1 gap-4">
        <TabsList className="self-start">
          <TabsTrigger value="chat" className={triggerClassName}>
            Room Chat
          </TabsTrigger>
          <TabsTrigger value="participants" className={triggerClassName}>
            Participant
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex min-h-0 flex-col gap-4">
          <ul className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
          </ul>

          <div className="relative shrink-0">
            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
              <Icon icon={SmileIcon} size={17} strokeWidth={1.8} />
            </span>
            <Input
              type="text"
              placeholder="Type something..."
              aria-label="Message"
              className="h-11 bg-muted/60 pr-12 pl-10"
            />
            <Button
              size="icon-sm"
              aria-label="Send message"
              className="absolute top-1/2 right-2 -translate-y-1/2"
            >
              <Icon icon={SentIcon} size={15} strokeWidth={1.8} />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="participants">
          <ul className="flex flex-col gap-3">
            {participants.map((participant) => (
              <li key={participant.id} className="flex items-center gap-2.5">
                <Avatar size="sm">
                  <AvatarImage src={participant.avatarUrl} alt="" />
                  <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0">
                  <span className="block truncate text-sm">{participant.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {participant.role}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </section>
  )
}
