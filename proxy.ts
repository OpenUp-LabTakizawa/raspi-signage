import { type NextRequest, NextResponse } from "next/server"

// This proxy runs in the Edge runtime where the `pg` driver cannot be loaded,
// so we only check whether a Better Auth session cookie is *present* — not
// whether it is valid. A forged cookie value will pass this gate.
//
// Real session validation lives in `src/auth/guard.ts` and is invoked at the
// top of every mutating Server Action and from `app/dashboard/layout.tsx`.
// Treat this proxy as a coarse first-line filter, not a security boundary.

export const PUBLIC_PATHS = ["/dashboard/login", "/dashboard/password-reset"]

const SESSION_COOKIE_NAMES = [
  "raspi-signage.session_token",
  "raspi-signage.session_token.0",
  "__Secure-raspi-signage.session_token",
  "__Secure-raspi-signage.session_token.0",
]

export type RoutingDecision =
  | { action: "pass" }
  | { action: "redirect"; destination: string }

export function getRoutingDecision(
  pathname: string,
  isAuthenticated: boolean,
): RoutingDecision {
  if (!pathname.startsWith("/dashboard")) {
    return { action: "pass" }
  }

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return { action: "pass" }
  }

  if (!isAuthenticated) {
    return { action: "redirect", destination: "/dashboard/login" }
  }

  return { action: "pass" }
}

export async function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIE_NAMES.some((name) =>
    request.cookies.has(name),
  )

  const decision = getRoutingDecision(request.nextUrl.pathname, hasSession)

  if (decision.action === "redirect") {
    const redirectUrl = new URL(decision.destination, request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next({ request })
}

export const matcherPattern =
  "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
