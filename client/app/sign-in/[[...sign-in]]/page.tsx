import type { Metadata } from "next"
import { SignIn } from "@clerk/nextjs"

export const metadata: Metadata = {
  title: "Sign in · MeetOS",
}

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <SignIn />
    </main>
  )
}
