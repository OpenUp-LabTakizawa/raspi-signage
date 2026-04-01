import { describe, expect, test } from "bun:test"
import * as fc from "fast-check"

import { matcherPattern as matcherString } from "@/proxy"

// Convert the Next.js matcher string to a RegExp for testing
const matcherPattern = new RegExp(`^${matcherString}$`)

describe("Property 7: Middleware static file exclusion", () => {
  const staticPaths = [
    fc.constant("/_next/static/chunk.js"),
    fc.constant("/_next/static/css/style.css"),
    fc.constant("/_next/image/photo.jpg"),
    fc.constant("/favicon.ico"),
    fc
      .string({ minLength: 1, maxLength: 20 })
      .map((s) => `/${s.replace(/[/\\]/g, "")}.svg`),
    fc
      .string({ minLength: 1, maxLength: 20 })
      .map((s) => `/${s.replace(/[/\\]/g, "")}.png`),
    fc
      .string({ minLength: 1, maxLength: 20 })
      .map((s) => `/${s.replace(/[/\\]/g, "")}.jpg`),
    fc
      .string({ minLength: 1, maxLength: 20 })
      .map((s) => `/${s.replace(/[/\\]/g, "")}.jpeg`),
    fc
      .string({ minLength: 1, maxLength: 20 })
      .map((s) => `/${s.replace(/[/\\]/g, "")}.gif`),
    fc
      .string({ minLength: 1, maxLength: 20 })
      .map((s) => `/${s.replace(/[/\\]/g, "")}.webp`),
  ]

  test("static file paths do not match the middleware matcher", () => {
    fc.assert(
      fc.property(fc.oneof(...staticPaths), (path) => {
        expect(matcherPattern.test(path)).toBe(false)
      }),
      { numRuns: 100 },
    )
  })

  test("dashboard paths match the middleware matcher", () => {
    const dashboardPaths = fc.oneof(
      fc.constant("/dashboard"),
      fc.constant("/dashboard/login"),
      fc.constant("/dashboard/manage-contents"),
      fc.constant("/dashboard/view-position"),
    )

    fc.assert(
      fc.property(dashboardPaths, (path) => {
        expect(matcherPattern.test(path)).toBe(true)
      }),
      { numRuns: 100 },
    )
  })
})
