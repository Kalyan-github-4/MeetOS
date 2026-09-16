"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"

import { apiFetch } from "@/lib/api"

export type CreateMeetingState = { error: string | null }

/**
 * Starting a meeting takes no input — the host lands straight in the room and
 * can share the link from there.
 */
export async function createMeetingAction(
  _previous: CreateMeetingState,
): Promise<CreateMeetingState> {
  await auth.protect()

  let created: { code: string }
  try {
    created = await apiFetch<{ code: string }>("/meetings", {
      method: "POST",
      body: JSON.stringify({}),
    })
  } catch {
    return { error: "Could not start the meeting. Is the API running?" }
  }

  revalidatePath("/dashboard")
  // redirect throws, so it must sit outside the try above.
  redirect(`/meeting/${created.code}`)
}
