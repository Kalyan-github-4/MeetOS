import {
  CallEnd01Icon,
  HeadphonesIcon,
  MicOff01Icon,
  VideoOffIcon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"

/**
 * The control rail pinned to the right edge of the stage.
 * Purely presentational for now — wiring lands with LiveKit (PLAN.md Phase 4).
 */
export function StageControls() {
  return (
    <div className="absolute top-1/2 right-3 z-10 flex -translate-y-1/2 flex-col gap-2">
      <Button
        variant="ghost"
        size="icon-lg"
        aria-label="Unmute microphone"
        className="bg-card/90 shadow-md backdrop-blur-sm hover:bg-card"
      >
        <Icon icon={MicOff01Icon} size={18} strokeWidth={1.8} />
      </Button>
      <Button
        variant="ghost"
        size="icon-lg"
        aria-label="Turn camera on"
        className="bg-card/90 shadow-md backdrop-blur-sm hover:bg-card"
      >
        <Icon icon={VideoOffIcon} size={18} strokeWidth={1.8} />
      </Button>
      <Button
        variant="ghost"
        size="icon-lg"
        aria-label="Audio settings"
        className="bg-card/90 shadow-md backdrop-blur-sm hover:bg-card"
      >
        <Icon icon={HeadphonesIcon} size={18} strokeWidth={1.8} />
      </Button>
      <Button
        size="icon-lg"
        aria-label="Leave meeting"
        className="bg-destructive text-white shadow-md hover:bg-destructive/90"
      >
        <Icon icon={CallEnd01Icon} size={18} strokeWidth={1.8} />
      </Button>
    </div>
  )
}
