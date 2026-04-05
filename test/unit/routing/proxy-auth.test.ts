import { describe, expect, test } from "bun:test"

import { getRoutingDecision } from "@/proxy"

/**
 * Unit tests for proxy.ts
 *
 * Verifies redirect/pass-through behavior for specific paths
 * Requirements: 1.1, 1.2, 1.3
 */
describe("proxy auth routing", () => {
  describe("unauthenticated user redirect (Requirement 1.1)", () => {
    test("redirect when unauthenticated on /dashboard", () => {
      const decision = getRoutingDecision("/dashboard", false)
      expect(decision).toEqual({
        action: "redirect",
        destination: "/dashboard/login",
      })
    })

    test("redirect when unauthenticated on /dashboard/manage-contents", () => {
      const decision = getRoutingDecision("/dashboard/manage-contents", false)
      expect(decision).toEqual({
        action: "redirect",
        destination: "/dashboard/login",
      })
    })

    test("redirect when unauthenticated on /dashboard/area-management", () => {
      const decision = getRoutingDecision("/dashboard/area-management", false)
      expect(decision).toEqual({
        action: "redirect",
        destination: "/dashboard/login",
      })
    })

    test("redirect when unauthenticated on /dashboard/view-position", () => {
      const decision = getRoutingDecision("/dashboard/view-position", false)
      expect(decision).toEqual({
        action: "redirect",
        destination: "/dashboard/login",
      })
    })
  })

  describe("authenticated user pass-through (Requirement 1.2)", () => {
    test("pass when authenticated on /dashboard", () => {
      const decision = getRoutingDecision("/dashboard", true)
      expect(decision).toEqual({ action: "pass" })
    })

    test("pass when authenticated on /dashboard/manage-contents", () => {
      const decision = getRoutingDecision("/dashboard/manage-contents", true)
      expect(decision).toEqual({ action: "pass" })
    })

    test("pass when authenticated on /dashboard/area-management", () => {
      const decision = getRoutingDecision("/dashboard/area-management", true)
      expect(decision).toEqual({ action: "pass" })
    })
  })

  describe("public path pass-through (Requirement 1.3)", () => {
    test("/dashboard/login passes even when unauthenticated", () => {
      const decision = getRoutingDecision("/dashboard/login", false)
      expect(decision).toEqual({ action: "pass" })
    })

    test("/dashboard/login passes when authenticated", () => {
      const decision = getRoutingDecision("/dashboard/login", true)
      expect(decision).toEqual({ action: "pass" })
    })

    test("/dashboard/password-reset passes even when unauthenticated", () => {
      const decision = getRoutingDecision("/dashboard/password-reset", false)
      expect(decision).toEqual({ action: "pass" })
    })

    test("/dashboard/password-reset passes when authenticated", () => {
      const decision = getRoutingDecision("/dashboard/password-reset", true)
      expect(decision).toEqual({ action: "pass" })
    })

    test("/dashboard/login/callback sub-path also passes", () => {
      const decision = getRoutingDecision("/dashboard/login/callback", false)
      expect(decision).toEqual({ action: "pass" })
    })
  })

  describe("paths outside /dashboard are skipped", () => {
    test("/ passes", () => {
      const decision = getRoutingDecision("/", false)
      expect(decision).toEqual({ action: "pass" })
    })

    test("/about passes", () => {
      const decision = getRoutingDecision("/about", false)
      expect(decision).toEqual({ action: "pass" })
    })

    test("/api/data passes", () => {
      const decision = getRoutingDecision("/api/data", false)
      expect(decision).toEqual({ action: "pass" })
    })
  })
})
