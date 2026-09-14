"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLocalParticipant, useRoomContext } from "@livekit/components-react"
import {
  CallEnd01Icon,
  ComputerIcon,
  Mic01Icon,
  MicOff01Icon,
  Video01Icon,
  VideoOffIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "cn"

import { Icon } from "@/components/ui/icon"

/**
 * One control. Filled when the device is live, hairline when it is not, so the
 * state of the room is legible without reading a single label.
 */
function Control({
  label,
  icon,
  active,
  disabled,
  onClick,
}: {
  label: string
  icon: typeof Mic01Icon
  active: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex size-11 items-center justify-center rounded-full border transition-colors disabled:opacity-40",
        active
          ? "border-ink bg-ink text-canvas"
          : "border-hairline bg-canvas text-ink hover:border-ink",
      )}
    >
      <Icon icon={icon} size={18} strokeWidth={1.8} />
    </button>
  )
}

/**
 * The control bar at the foot of the stage.
 *
 * Toggles read their on/off state from LiveKit rather than local state, so a
 * device that fails to start (permission denied, camera in use) leaves the
 * button showing the truth instead of an optimistic lie.
 */
export function LiveControls({ onLeave }: { onLeave: () => void }) {
  const room = useRoomContext()
  const {
    localParticipant,
    isMicrophoneEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
  } = useLocalParticipant()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function toggle(kind: "mic" | "camera" | "screen") {
    setBusy(true)
    try {
      if (kind === "mic") {
        await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)
      } else if (kind === "camera") {
        await localParticipant.setCameraEnabled(!isCameraEnabled)
      } else {
        await localParticipant.setScreenShareEnabled(!isScreenShareEnabled)
      }
    } catch (error) {
      // Most often a denied permission prompt — nothing to recover, but the
      // console should say why the button did not change.
      console.error(`Could not toggle ${kind}`, error)
    } finally {
      setBusy(false)
    }
  }

  async function leave() {
    setBusy(true)
    await room.disconnect()
    onLeave()
    router.push("/dashboard")
  }

  return (
    <div className="absolute inset-x-0 bottom-5 z-10 flex justify-center">
      <div className="flex items-center gap-2 rounded-full border border-hairline bg-canvas/90 p-2 backdrop-blur-md">
        <Control
          label={isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"}
          icon={isMicrophoneEnabled ? Mic01Icon : MicOff01Icon}
          active={isMicrophoneEnabled}
          disabled={busy}
          onClick={() => void toggle("mic")}
        />

        <Control
          label={isCameraEnabled ? "Turn camera off" : "Turn camera on"}
          icon={isCameraEnabled ? Video01Icon : VideoOffIcon}
          active={isCameraEnabled}
          disabled={busy}
          onClick={() => void toggle("camera")}
        />

        <Control
          label={isScreenShareEnabled ? "Stop sharing screen" : "Share screen"}
          icon={ComputerIcon}
          active={isScreenShareEnabled}
          disabled={busy}
          onClick={() => void toggle("screen")}
        />

        <span aria-hidden className="mx-1 h-6 w-px bg-hairline" />

        {/* The accent is spent here: leaving is the one irreversible thing in
            the room, and the only control that should be findable at a glance. */}
        <button
          type="button"
          onClick={() => void leave()}
          disabled={busy}
          aria-label="Leave meeting"
          className="flex h-11 items-center gap-2 rounded-full bg-ember px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Icon icon={CallEnd01Icon} size={17} strokeWidth={1.8} />
          Leave
        </button>
      </div>
    </div>
  )
}
