"use client"

// `@hugeicons/react` builds its icon component with `forwardRef` and ships no
// "use client" directive of its own, so it cannot be rendered directly from a
// Server Component. Re-exporting it here marks the boundary once, which lets
// the meeting screen stay a Server Component.
export { HugeiconsIcon as Icon } from "@hugeicons/react"
