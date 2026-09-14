/**
 * Which model stands in for a participant whose camera is off.
 *
 * Assignment is derived from the participant id rather than stored, so the same
 * person keeps the same figure for as long as they hold a seat, on every screen
 * in the room, with nothing to migrate or look up.
 */

/** Muted clay tones — close enough to the paper theme to sit beside it. */
export const PALETTES = [
  { key: "terracotta", light: "#E8A987", base: "#C97B5A", dark: "#8E4F36", ground: "#EFE2DA" },
  { key: "sand", light: "#E6CB93", base: "#C6A45E", dark: "#8B7134", ground: "#F0E9D9" },
  { key: "sage", light: "#AEC2A6", base: "#7F9478", dark: "#54654F", ground: "#E4EADF" },
  { key: "slate", light: "#A3AFC0", base: "#6F7A8A", dark: "#48515E", ground: "#E3E7EC" },
  { key: "rose", light: "#D79C8B", base: "#B0705F", dark: "#7A4637", ground: "#EEDFD9" },
  { key: "moss", light: "#B8B487", base: "#8A8659", dark: "#5C5936", ground: "#E9E7D8" },
] as const

/**
 * Headset styles. Everyone wears one with a mic — it is what makes the figure
 * read as someone on a call rather than a generic mascot — so the axis that
 * keeps two people on the same palette apart is over-ear against single-ear.
 */
export const SHAPES = ["duo", "mono"] as const

export type AvatarModel = {
  palette: (typeof PALETTES)[number]
  shape: (typeof SHAPES)[number]
}

export const MODEL_COUNT = PALETTES.length * SHAPES.length

/**
 * A stable, well-spread index for an arbitrary id.
 *
 * Participant ids are UUIDs, whose leading characters barely vary — so this
 * folds the whole string rather than sampling it, or most of a room would end
 * up wearing the same face.
 */
function hash(id: string): number {
  let value = 0
  for (let index = 0; index < id.length; index += 1) {
    value = (value * 31 + id.charCodeAt(index)) | 0
  }

  return Math.abs(value)
}

export function modelByIndex(index: number): AvatarModel {
  // Wraps rather than clamps, so an index from elsewhere — a stored choice, an
  // attribute set by another client — can never render nothing.
  const wrapped = ((index % MODEL_COUNT) + MODEL_COUNT) % MODEL_COUNT

  return {
    palette: PALETTES[wrapped % PALETTES.length]!,
    shape: SHAPES[Math.floor(wrapped / PALETTES.length) % SHAPES.length]!,
  }
}

/** The figure someone gets when they have not chosen one. */
export function defaultIndexFor(id: string): number {
  return hash(id) % MODEL_COUNT
}

export function modelFor(id: string): AvatarModel {
  return modelByIndex(defaultIndexFor(id))
}

/**
 * The LiveKit participant attribute carrying someone's chosen figure.
 *
 * Attributes rather than a database column: the choice only matters for the
 * length of a call, everyone in the room is already subscribed to changes, and
 * it needs no migration or extra round trip at join.
 */
export const AVATAR_ATTRIBUTE = "avatar"

/**
 * How long this person waits before their first blink, in seconds.
 *
 * Derived from the id so a roomful of figures never blinks in unison, which
 * would look mechanical in exactly the way a blink is meant to avoid.
 */
export function blinkDelayFor(id: string): number {
  return (hash(id) % 47) / 10
}

/** Attribute values arrive as strings from other clients — trust none of it. */
export function parseAvatarAttribute(value: string | undefined): number | null {
  if (!value) return null

  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) ? parsed : null
}
