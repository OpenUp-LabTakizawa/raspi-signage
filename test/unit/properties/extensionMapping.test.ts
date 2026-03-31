import { describe, expect, test } from "bun:test"
import * as fc from "fast-check"
import { mapExtension } from "../../../utilities/mapExtension"

describe("Property 1: Extension mapping correctness", () => {
  test("always returns .tsx when containsJsx=true", () => {
    expect(mapExtension(true)).toBe(".tsx")
  })

  test("always returns .ts when containsJsx=false", () => {
    expect(mapExtension(false)).toBe(".ts")
  })

  test("returns correct extension for any JSX flag", () => {
    fc.assert(
      fc.property(fc.boolean(), (containsJsx) => {
        const result = mapExtension(containsJsx)
        if (containsJsx) {
          expect(result).toBe(".tsx")
        } else {
          expect(result).toBe(".ts")
        }
      }),
      { numRuns: 100 },
    )
  })
})
