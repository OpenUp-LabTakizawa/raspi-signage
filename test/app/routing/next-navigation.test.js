import { describe, expect, test } from "bun:test"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, resolve } from "node:path"

const root = resolve(import.meta.dir, "../../..")

function collectJsFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      files.push(...collectJsFiles(full))
    } else if (full.endsWith(".js")) {
      files.push(full)
    }
  }
  return files
}

describe("App Router migration: next/router replaced with next/navigation", () => {
  const appFiles = collectJsFiles(resolve(root, "app"))
  const componentFiles = collectJsFiles(resolve(root, "components"))
  const allFiles = [...appFiles, ...componentFiles]

  test("no files import from next/router", () => {
    const offenders = []
    for (const file of allFiles) {
      const content = readFileSync(file, "utf-8")
      if (
        content.includes('from "next/router"') ||
        content.includes("from 'next/router'")
      ) {
        offenders.push(file.replace(`${root}/`, ""))
      }
    }
    expect(offenders).toEqual([])
  })

  test("components using useRouter import from next/navigation", () => {
    for (const file of allFiles) {
      const content = readFileSync(file, "utf-8")
      if (content.includes("useRouter")) {
        expect(content).toContain("next/navigation")
      }
    }
  })

  test("components using usePathname import from next/navigation", () => {
    for (const file of allFiles) {
      const content = readFileSync(file, "utf-8")
      if (content.includes("usePathname")) {
        expect(content).toContain("next/navigation")
      }
    }
  })

  test("components using useSearchParams import from next/navigation", () => {
    for (const file of allFiles) {
      const content = readFileSync(file, "utf-8")
      if (content.includes("useSearchParams")) {
        expect(content).toContain("next/navigation")
      }
    }
  })
})
