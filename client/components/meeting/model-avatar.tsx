import { blinkDelayFor, defaultIndexFor, modelByIndex } from "@/lib/avatars"

/** Warm near-black rather than pure black — pure black reads as a hole. */
const EYE = "#2E2622"

/**
 * The figure shown in place of a camera feed.
 *
 * Drawn as shaded vector rather than a rendered PNG: it stays sharp from a
 * 28px roster row to a full-bleed stage, weighs nothing, needs no asset
 * pipeline, and the palette can follow the theme instead of being baked into a
 * file. The gradients do the work a render would — a key light from the upper
 * left, a contact shadow, and a rim light along the lit edge.
 */
export function ModelAvatar({
  id,
  name,
  index,
  className,
}: {
  id: string
  name: string
  /** The figure this person picked. Falls back to one derived from their id,
   *  which covers anyone who joined before the picker or never touched it. */
  index?: number
  className?: string
}) {
  const { palette, shape } = modelByIndex(index ?? defaultIndexFor(id))

  // Gradient ids share one document, so several tiles on screen would otherwise
  // reference whichever definition rendered last.
  const uid = `avatar-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`

  return (
    <svg
      viewBox="0 0 160 160"
      role="img"
      aria-label={`${name} — camera off`}
      className={className}
    >
      <defs>
        <radialGradient id={`${uid}-ground`} cx="50%" cy="34%" r="76%">
          <stop offset="0%" stopColor={palette.ground} />
          <stop offset="100%" stopColor={palette.dark} stopOpacity="0.22" />
        </radialGradient>

        <radialGradient id={`${uid}-head`} cx="33%" cy="26%" r="82%">
          <stop offset="0%" stopColor={palette.light} />
          <stop offset="58%" stopColor={palette.base} />
          <stop offset="100%" stopColor={palette.dark} />
        </radialGradient>

        <radialGradient id={`${uid}-body`} cx="30%" cy="8%" r="92%">
          <stop offset="0%" stopColor={palette.light} />
          <stop offset="55%" stopColor={palette.base} />
          <stop offset="100%" stopColor={palette.dark} />
        </radialGradient>

        <radialGradient id={`${uid}-shadow`}>
          <stop offset="0%" stopColor="#2A2320" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#2A2320" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="160" height="160" fill={`url(#${uid}-ground)`} />

      {/* Left behind by the figure, so the float above reads as a lift off the
          ground rather than the whole scene sliding. */}
      <ellipse cx="80" cy="133" rx="44" ry="9" fill={`url(#${uid}-shadow)`} />

      <g className="avatar-float">
        <path
          d="M39 134 C39 107 57 94 80 94 C103 94 121 107 121 134 Z"
          fill={`url(#${uid}-body)`}
        />

        {/* Behind the head, so the band passes over the crown rather than
            across the face. */}
        <path
          d="M53 60 A27 27 0 0 1 107 60"
          fill="none"
          stroke={palette.dark}
          strokeWidth="7"
          strokeLinecap="round"
        />

        <circle cx="80" cy="59" r="27" fill={`url(#${uid}-head)`} />

        {/* Catches the key light along the top-left edge only. */}
        <circle
          cx="80"
          cy="59"
          r="26"
          fill="none"
          stroke={palette.light}
          strokeOpacity="0.55"
          strokeWidth="1.6"
          strokeDasharray="44 130"
          strokeDashoffset="26"
        />

        {/* Set just inside the silhouette, so the head still reads as a sphere
            rather than a disc with marks on it. */}
        <g className="avatar-blink" style={{ animationDelay: `${blinkDelayFor(id)}s` }}>
          {[70, 90].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy={60} rx={3.4} ry={4.4} fill={EYE} />
              {/* The catchlight is what makes them look wet, not printed. */}
              <circle
                cx={x - 1.2}
                cy={58.2}
                r={1.15}
                fill="#FFFFFF"
                fillOpacity="0.85"
              />
            </g>
          ))}
        </g>

        <rect x="103" y="52" width="12" height="20" rx="6" fill={palette.dark} />

        {/* Single-ear styles leave the far side bare. */}
        {shape === "duo" ? (
          <rect x="45" y="52" width="12" height="20" rx="6" fill={palette.dark} />
        ) : null}

        {/* The arm reaching round to the mouth, and the capsule on the end. */}
        <path
          d="M109 71 Q108 83 95 81"
          fill="none"
          stroke={palette.dark}
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <circle cx="94" cy="80.6" r="3" fill={palette.dark} />
      </g>
    </svg>
  )
}
