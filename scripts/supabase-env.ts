import { file } from "bun"

const ENV_PATH = ".env"

const SUPABASE_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const

const proc = Bun.spawn(["supabase", "status", "--output", "json"], {
  stdout: "pipe",
  stderr: "inherit",
})

const output = await new Response(proc.stdout).text()
const exitCode = await proc.exited
if (exitCode !== 0) {
  console.error("Failed to get Supabase status. Is Supabase running?")
  process.exit(1)
}

const status = JSON.parse(output) as Record<string, string>

const newVars: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
}

for (const key of SUPABASE_KEYS) {
  if (!newVars[key]) {
    console.error(`Missing "${key}" in supabase status output`)
    process.exit(1)
  }
}

// Read existing .env and merge, preserving non-Supabase variables
const supabaseKeySet = new Set<string>(SUPABASE_KEYS)
let existing = ""
if (await file(ENV_PATH).exists()) {
  existing = await file(ENV_PATH).text()
}

const preserved = existing.split("\n").filter((line) => {
  const key = line.split("=")[0]?.trim()
  return key && !supabaseKeySet.has(key)
})

const supabaseLines = SUPABASE_KEYS.map((key) => `${key}=${newVars[key]}`)
const merged = `${[...preserved, ...supabaseLines].join("\n")}\n`

await Bun.write(ENV_PATH, merged)
console.log("✅ .env updated with Supabase credentials")
