"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import {
  createMeetingAction,
  type CreateMeetingState,
} from "@/app/(app)/dashboard/actions"

const initialState: CreateMeetingState = { error: null }

export function CreateMeetingForm() {
  const [state, formAction, pending] = useActionState(
    createMeetingAction,
    initialState,
  )

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <Button type="submit" disabled={pending} size="lg">
        {pending ? "Starting…" : "New meeting"}
      </Button>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}
    </form>
  )
}
