/**
 * The radiating line motif anchoring the hero.
 *
 * Drawn rather than illustrated: a fan of hairlines from a single origin costs
 * nothing to ship, stays crisp at any size, and takes its colour from the page
 * so it can never drift from the palette the way a flat image would.
 */

const LINE_COUNT = 116
const ORIGIN = { x: 200, y: 400 }
const INNER_RADIUS = 66
const OUTER_RADIUS = 372

/**
 * Length variation per line.
 *
 * Deterministic rather than random: the same fan renders on the server and in
 * the browser, and every visitor sees the composition that was designed.
 */
function outerRadius(index: number): number {
  const wave = Math.sin(index * 0.7) * 5 + Math.sin(index * 0.23) * 11
  return OUTER_RADIUS + wave
}

export function Sunburst({ className }: { className?: string }) {
  // Half a turn, opening upward from the origin at the bottom edge.
  const lines = Array.from({ length: LINE_COUNT }, (_, index) => {
    const angle = Math.PI + (index / (LINE_COUNT - 1)) * Math.PI
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const reach = outerRadius(index)

    return {
      key: index,
      x1: ORIGIN.x + cos * INNER_RADIUS,
      y1: ORIGIN.y + sin * INNER_RADIUS,
      x2: ORIGIN.x + cos * reach,
      y2: ORIGIN.y + sin * reach,
    }
  })

  return (
    <svg
      viewBox="0 0 400 400"
      aria-hidden
      focusable="false"
      className={className}
    >
      <g stroke="var(--ink)" strokeWidth="1.15" strokeLinecap="round">
        {lines.map((line) => (
          <line
            key={line.key}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
          />
        ))}
      </g>

      {/* Sits over the convergence point, where the lines would otherwise crowd
          into a solid blot. */}
      <circle
        cx={ORIGIN.x}
        cy={ORIGIN.y}
        r={INNER_RADIUS - 24}
        fill="var(--canvas)"
        stroke="var(--hairline)"
        strokeWidth="1"
      />
    </svg>
  )
}
