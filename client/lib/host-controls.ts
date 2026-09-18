import { createContext, useContext } from "react"

import type { ModerationAction } from "@/lib/livekit"

/**
 * The caller's standing in the room, for panels rendered inside it.
 *
 * A context rather than props because the side panels are built by the server
 * page and handed to the room as children — they cannot be given the role the
 * room only learns after connecting. A plain module for the same reason as
 * `meeting-seat.ts`: its exports must stay reachable from client components.
 *
 * Showing or hiding a control is only a convenience. The API checks that the
 * caller is the host on every action.
 */
export type HostControls = {
  isHost: boolean
  /** Rejects with a message fit to show when the action fails. */
  moderate: (participantId: string, action: ModerationAction) => Promise<void>
}

export const HostControlsContext = createContext<HostControls>({
  isHost: false,
  moderate: async () => {
    throw new Error("Not in a meeting")
  },
})

export function useHostControls(): HostControls {
  return useContext(HostControlsContext)
}
