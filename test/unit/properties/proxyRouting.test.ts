import { describe, expect, test } from "bun:test"
import * as fc from "fast-check"

import { getRoutingDecision, PUBLIC_PATHS } from "@/proxy"

describe("Property 1: Proxy routing correctness", () => {
  const dashboardSegment = fc.stringMatching(/^[a-z][a-z-]{0,19}$/)

  const protectedDashboardPath = dashboardSegment
    .filter(
      (seg) =>
        seg !== "login" &&
        seg !== "password-reset" &&
        !seg.startsWith("login") &&
        !seg.startsWith("password-reset"),
    )
    .map((seg) => `/dashboard/${seg}`)

  const publicPath = fc.oneof(
    fc.constant("/dashboard/login"),
    fc.constant("/dashboard/password-reset"),
    fc.constant("/dashboard/login/callback"),
    fc.constant("/dashboard/password-reset/confirm"),
  )

  const nonDashboardPath = dashboardSegment.map((seg) => `/${seg}`)

  const authState = fc.boolean()

  test("public paths pass regardless of auth state", () => {
    fc.assert(
      fc.property(publicPath, authState, (path, isAuthenticated) => {
        const decision = getRoutingDecision(path, isAuthenticated)
        expect(decision).toEqual({ action: "pass" })
      }),
      { numRuns: 100 },
    )
  })

  test("paths outside /dashboard pass regardless of auth state", () => {
    fc.assert(
      fc.property(nonDashboardPath, authState, (path, isAuthenticated) => {
        const decision = getRoutingDecision(path, isAuthenticated)
        expect(decision).toEqual({ action: "pass" })
      }),
      { numRuns: 100 },
    )
  })

  test("protected paths redirect when unauthenticated", () => {
    fc.assert(
      fc.property(protectedDashboardPath, (path) => {
        const decision = getRoutingDecision(path, false)
        expect(decision).toEqual({
          action: "redirect",
          destination: "/dashboard/login",
        })
      }),
      { numRuns: 100 },
    )
  })

  test("protected paths pass when authenticated", () => {
    fc.assert(
      fc.property(protectedDashboardPath, (path) => {
        const decision = getRoutingDecision(path, true)
        expect(decision).toEqual({ action: "pass" })
      }),
      { numRuns: 100 },
    )
  })

  test("/dashboard itself is treated as a protected path", () => {
    fc.assert(
      fc.property(authState, (isAuthenticated) => {
        const decision = getRoutingDecision("/dashboard", isAuthenticated)
        if (isAuthenticated) {
          expect(decision).toEqual({ action: "pass" })
        } else {
          expect(decision).toEqual({
            action: "redirect",
            destination: "/dashboard/login",
          })
        }
      }),
      { numRuns: 100 },
    )
  })

  test("each path in PUBLIC_PATHS always passes", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...PUBLIC_PATHS),
        authState,
        (path, isAuthenticated) => {
          const decision = getRoutingDecision(path, isAuthenticated)
          expect(decision).toEqual({ action: "pass" })
        },
      ),
      { numRuns: 100 },
    )
  })
})
