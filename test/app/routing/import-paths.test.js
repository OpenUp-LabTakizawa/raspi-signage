import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(import.meta.dir, "../../..")

describe("App Router migration: import paths resolve correctly", () => {
  const pageImports = [
    {
      page: "app/dashboard/Login/page.js",
      expectedImport: "../../../components/dashboard/LoginComponent",
    },
    {
      page: "app/dashboard/PasswordReset/page.js",
      expectedImport: "../../../components/dashboard/PasswordResetComponent",
    },
    {
      page: "app/dashboard/ManageContents/page.js",
      expectedImport: "../../../components/dashboard/ManageContentsList",
    },
    {
      page: "app/dashboard/AccountSettingManagement/page.js",
      expectedImport:
        "../../../components/dashboard/AccountSettingManagementComponent",
    },
    {
      page: "app/dashboard/AreaManagement/page.js",
      expectedImport: "../../../components/dashboard/AreaManagementComponent",
    },
    {
      page: "app/dashboard/UserAccountManagement/page.js",
      expectedImport:
        "../../../components/dashboard/UserAccountManagementComponent",
    },
    {
      page: "app/dashboard/ViewPosition/page.js",
      expectedImport: "../../../components/dashboard/ViewPostionComponent",
    },
    {
      page: "app/dashboard/layout.js",
      expectedImport: "../../components/dashboard/Dashboard",
    },
    {
      page: "app/dashboard/page.js",
      expectedImport: "../../components/dashboard/UplaodContents",
    },
  ]

  for (const { page, expectedImport } of pageImports) {
    test(`${page} imports from correct relative path`, () => {
      const content = readFileSync(resolve(root, page), "utf-8")
      expect(content).toContain(expectedImport)
    })
  }

  test("all component imports resolve to existing files", () => {
    for (const { page, expectedImport } of pageImports) {
      const pageDir = resolve(root, page, "..")
      const resolved = resolve(pageDir, `${expectedImport}.js`)
      const { existsSync } = require("node:fs")
      expect(existsSync(resolved)).toBe(true)
    }
  })
})
