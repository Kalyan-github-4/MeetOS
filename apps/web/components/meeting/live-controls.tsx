"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react"
import {
  CallEnd01Icon,
  ComputerIcon,
  Mic01Icon,
  MicOff01Icon,
  Video01Icon,
  VideoOffIcon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"

/**
 * The control rail pinned to the right edge of the stage.
 *
 * Toggles read their on/off state from LiveKit rather than local state, so a
 * device that fails to start (permission denied, camera in use) leaves the
 * button showing the truth instead of an optimistic lie.
 */
export function LiveControls({ onLeave }: { onLeave: () => void }) {
  const room = useRoomContext()
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } =
    useLocalParticipant()
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
    <div className="absolute top-1/2 right-3 z-10 flex -translate-y-1/2 flex-col gap-2">
      <Button
        variant="ghost"
        size="icon-lg"
        disabled={busy}
        onClick={() => void toggle("mic")}
        aria-label={isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"}
        aria-pressed={isMicrophoneEnabled}
        className="bg-card/90 shadow-md backdrop-blur-sm hover:bg-card"
      >
        <Icon
          icon={isMicrophoneEnabled ? Mic01Icon : MicOff01Icon}
          size={18}
          strokeWidth={1.8}
        />
      </Button>

      <Button
        variant="ghost"
        size="icon-lg"
        disabled={busy}
        onClick={() => void toggle("camera")}
        aria-label={isCameraEnabled ? "Turn camera off" : "Turn camera on"}
        aria-pressed={isCameraEnabled}
        className="bg-card/90 shadow-md backdrop-blur-sm hover:bg-card"
      >
        <Icon
          icon={isCameraEnabled ? Video01Icon : VideoOffIcon}
          size={18}
          strokeWidth={1.8}
        />
      </Button>

      <Button
        variant="ghost"
        size="icon-lg"
        disabled={busy}
        onClick={() => void toggle("screen")}
        aria-label={isScreenShareEnabled ? "Stop sharing screen" : "Share screen"}
        aria-pressed={isScreenShareEnabled}
        className="bg-card/90 shadow-md backdrop-blur-sm hover:bg-card"
      >
        <Icon icon={ComputerIcon} size={18} strokeWidth={1.8} />
      </Button>

      <Button
        size="icon-lg"
        disabled={busy}
        onClick={() => void leave()}
        aria-label="Leave meeting"
        className="bg-destructive text-white shadow-md hover:bg-destructive/90"
      >
        <Icon icon={CallEnd01Icon} size={18} strokeWidth={1.8} />
      </Button>
    </div>
  )
}
