import type { ReactNode } from "react"
import { auth } from "@clerk/nextjs/server"

/**
 * Everything in this route group requires a signed-in user. Enforcing it here,
 * beside the data, rather than in a proxy matcher is Clerk's recommended
 * pattern — a new route added under this group is protected by construction.
 */
export default async function AuthenticatedLayout({
  children,
}: {
  children: ReactNode
}) {
  await auth.protect()

  return <>{children}</>
}
