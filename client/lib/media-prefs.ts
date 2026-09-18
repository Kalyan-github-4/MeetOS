/**
 * Which devices this browser uses, and whether mic and camera start on.
 *
 * Global rather than per meeting: the headset someone picked yesterday is the
 * one they want today. Kept in localStorage, so it is a per-browser convenience
 * and every read falls back to defaults when storage is unavailable.
 */

export type MediaPrefs = {
  micOn: boolean
  camOn: boolean
  /** Unset means the browser's default device. */
  audioInputId?: string
  videoInputId?: string
  audioOutputId?: string
}

const STORAGE_KEY = "meetup:media"

/** Mic on, camera off: joining never surprises anyone with a video feed. */
const DEFAULTS: MediaPrefs = { micOn: true, camOn: false }

export function readMediaPrefs(): MediaPrefs {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<MediaPrefs>
    return {
      micOn: typeof parsed.micOn === "boolean" ? parsed.micOn : DEFAULTS.micOn,
      camOn: typeof parsed.camOn === "boolean" ? parsed.camOn : DEFAULTS.camOn,
      audioInputId: stringOrUndefined(parsed.audioInputId),
      videoInputId: stringOrUndefined(parsed.videoInputId),
      audioOutputId: stringOrUndefined(parsed.audioOutputId),
    }
  } catch {
    return DEFAULTS
  }
}

/** Merges a change into what is stored, so callers only name what moved. */
export function saveMediaPrefs(change: Partial<MediaPrefs>): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...readMediaPrefs(), ...change }),
    )
  } catch {
    // Unavailable storage just means the choice is not remembered.
  }
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined
}
