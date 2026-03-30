import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(import.meta.dir, "../../..")

describe("App Router migration: 'use client' directives", () => {
  const clientPages = [
    "app/layout.js",
    "app/page.js",
    "app/dashboard/layout.js",
    "app/dashboard/page.js",
    "app/dashboard/Login/page.js",
    "app/dashboard/PasswordReset/page.js",
    "app/dashboard/ManageContents/page.js",
    "app/dashboard/AccountSettingManagement/page.js",
    "app/dashboard/AreaManagement/page.js",
    "app/dashboard/UserAccountManagement/page.js",
    "app/dashboard/ViewPosition/page.js",
  ]

  for (const page of clientPages) {
    test(`${page} has "use client" directive`, () => {
      const content = readFileSync(resolve(root, page), "utf-8")
      expect(content.trimStart().startsWith('"use client"')).toBe(true)
    })
  }
})
