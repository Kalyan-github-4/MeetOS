import { clerkMiddleware } from "@clerk/nextjs/server"

/**
 * Next 16 renamed the `middleware` convention to `proxy`; Clerk's helper is
 * still called `clerkMiddleware` and slots in unchanged as the default export.
 *
 * This deliberately enforces nothing. Clerk v7 deprecated path-based route
 * matching here because a matcher can drift from how Next actually routes a
 * request, leaving protected data reachable. Auth is enforced next to the data
 * instead — see app/(app)/layout.tsx. All this does is attach the auth context
 * so `auth()` works in server components.
 */
export default clerkMiddleware()

export const config = {
  matcher: [
    // Skip Next internals and static files unless they appear in search params.
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
