import type { Metadata } from "next"
import { SignUp } from "@clerk/nextjs"

export const metadata: Metadata = {
  title: "Sign up · MeetOS",
}

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <SignUp />
    </main>
  )
}
