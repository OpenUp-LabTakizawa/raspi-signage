"use server"

import { requireSession } from "@/src/auth/guard"
import { getStorage } from "@/src/storage"

// Authenticated.
export async function downLoadURLList({
  areaId,
}: {
  areaId: string
}): Promise<string[]> {
  await requireSession()
  try {
    const storage = getStorage()
    const objects = await storage.list(areaId)
    return objects.map((obj) => obj.url)
  } catch {
    return []
  }
}
