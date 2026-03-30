import { describe, expect, test } from "bun:test"
import { existsSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(import.meta.dir, "../../..")

describe("App Router migration: file structure", () => {
  const appRouterPages = [
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

  for (const page of appRouterPages) {
    test(`${page} exists`, () => {
      expect(existsSync(resolve(root, page))).toBe(true)
    })
  }

  const deletedPagesRouterFiles = [
    "pages/_app.js",
    "pages/_document.js",
    "pages/index.js",
    "pages/dashboard/index.js",
    "pages/dashboard/Login.js",
    "pages/dashboard/PasswordReset.js",
    "pages/dashboard/ManageContents.js",
    "pages/dashboard/AccountSettingManagement.js",
    "pages/dashboard/AreaManagement.js",
    "pages/dashboard/UserAccountManagement.js",
    "pages/dashboard/ViewPosition.js",
  ]

  for (const page of deletedPagesRouterFiles) {
    test(`old ${page} has been removed`, () => {
      expect(existsSync(resolve(root, page))).toBe(false)
    })
  }
})
