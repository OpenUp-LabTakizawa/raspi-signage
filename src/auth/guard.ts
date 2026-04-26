// Authorization guards for Server Actions.
// Server-only — never imported from client components.
//
// Pattern: every mutating Server Action should start with one of the
// `require*()` helpers below. Read-only actions exposed to the public
// signage device (`/?areaId=...` flow) deliberately skip these guards;
// see comments on those actions in `src/services/contents-admin.ts` and
// `src/services/pixel-sizes.ts`.

import { headers } from "next/headers"
import { queryOne } from "@/src/db/client"
import { getAuth } from "./server"

export interface SessionPayload {
  user: { id: string; email: string }
}

async function loadSession(): Promise<SessionPayload | null> {
  const session = await getAuth().api.getSession({ headers: await headers() })
  if (!session?.user) {
    return null
  }
  return {
    user: { id: session.user.id, email: session.user.email },
  }
}

async function isAdminUser(uid: string): Promise<boolean> {
  const row = await queryOne<{ management: boolean; deleted: boolean }>(
    `SELECT management, deleted FROM "user" WHERE id = $1`,
    [uid],
  )
  return !!row && !row.deleted && row.management
}

/** Throw 401 if no signed-in user. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await loadSession()
  if (!session) {
    throw new Error("Unauthorized")
  }
  return session
}

/** Throw 401 if no session, 403 if not an active admin. */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireSession()
  if (!(await isAdminUser(session.user.id))) {
    throw new Error("Forbidden")
  }
  return session
}

/** Allow only the owner of `uid` (or any active admin) to proceed. */
export async function requireSelfOrAdmin(uid: string): Promise<SessionPayload> {
  const session = await requireSession()
  if (session.user.id === uid) {
    return session
  }
  if (!(await isAdminUser(session.user.id))) {
    throw new Error("Forbidden")
  }
  return session
}

/** Allow only the owner of `uid` to proceed. Used for self-only operations. */
export async function requireSelf(uid: string): Promise<SessionPayload> {
  const session = await requireSession()
  if (session.user.id !== uid) {
    throw new Error("Forbidden")
  }
  return session
}

/** Allow only the user whose session matches `email` to proceed. */
export async function requireEmail(email: string): Promise<SessionPayload> {
  const session = await requireSession()
  if (session.user.email !== email) {
    throw new Error("Forbidden")
  }
  return session
}
