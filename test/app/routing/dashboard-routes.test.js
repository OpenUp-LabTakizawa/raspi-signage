import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(import.meta.dir, "../../..")

describe("App Router migration: dashboard route parity", () => {
  const routes = [
    { path: "/dashboard", page: "app/dashboard/page.js" },
    { path: "/dashboard/Login", page: "app/dashboard/Login/page.js" },
    {
      path: "/dashboard/PasswordReset",
      page: "app/dashboard/PasswordReset/page.js",
    },
    {
      path: "/dashboard/ManageContents",
      page: "app/dashboard/ManageContents/page.js",
    },
    {
      path: "/dashboard/AccountSettingManagement",
      page: "app/dashboard/AccountSettingManagement/page.js",
    },
    {
      path: "/dashboard/AreaManagement",
      page: "app/dashboard/AreaManagement/page.js",
    },
    {
      path: "/dashboard/UserAccountManagement",
      page: "app/dashboard/UserAccountManagement/page.js",
    },
    {
      path: "/dashboard/ViewPosition",
      page: "app/dashboard/ViewPosition/page.js",
    },
  ]

  test("all dashboard routes export a default function component", () => {
    for (const { page } of routes) {
      const content = readFileSync(resolve(root, page), "utf-8")
      expect(content).toMatch(/export\s+default\s+function\s+\w+/)
    }
  })

  test("navigation links in ListItems match App Router paths", () => {
    const content = readFileSync(
      resolve(root, "components/dashboard/ListItems.js"),
      "utf-8",
    )
    const expectedPaths = [
      "/dashboard",
      "/dashboard/ManageContents",
      "/dashboard/ViewPosition",
      "/dashboard/AreaManagement",
      "/dashboard/UserAccountManagement",
      "/dashboard/AccountSettingManagement",
    ]
    for (const path of expectedPaths) {
      expect(content).toContain(`"${path}"`)
    }
  })

  test("login redirects in components use App Router paths", () => {
    const files = [
      "components/dashboard/LoginComponent.js",
      "components/dashboard/PasswordResetComponent.js",
    ]
    for (const file of files) {
      const content = readFileSync(resolve(root, file), "utf-8")
      // Should use /dashboard/Login or /dashboard/PasswordReset paths
      if (content.includes("router.push")) {
        expect(content).toMatch(/router\.push\(["']\/dashboard/)
      }
    }
  })

  test("Dashboard component uses usePathname for route detection", () => {
    const content = readFileSync(
      resolve(root, "components/dashboard/Dashboard.js"),
      "utf-8",
    )
    expect(content).toContain("usePathname")
    expect(content).toContain("AREA_DISPLAY_PATHS")
    expect(content).toContain("PASS_PATHS")
  })
})
