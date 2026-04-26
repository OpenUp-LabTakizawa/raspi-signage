"use server"

import { requireAdmin, requireSession } from "@/src/auth/guard"
import { query, queryOne, queryRows, withTransaction } from "@/src/db/client"
import type {
  Content,
  ContentListItem,
  Order,
  PixelSize,
  PixelSizeInfo,
} from "@/src/db/types"
import { handleDataError } from "@/src/services/errors"

// Get all non-deleted contents (dashboard usage).
export async function getContentsDataClient(): Promise<Content[]> {
  await requireSession()
  try {
    return await queryRows<Content>(
      `SELECT area_id, area_name, order_id, pixel_size_id, deleted
         FROM contents
        WHERE deleted = false`,
    )
  } catch (e) {
    handleDataError({
      message: e instanceof Error ? e.message : "コンテンツ取得に失敗しました",
    })
  }
}

// Get order by ID (dashboard usage).
export async function getOrderById(orderId: string): Promise<Order | null> {
  await requireSession()
  try {
    return await queryOne<Order>(
      `SELECT id, set1, hidden FROM orders WHERE id = $1`,
      [orderId],
    )
  } catch (e) {
    handleDataError({
      message: e instanceof Error ? e.message : "オーダー取得に失敗しました",
    })
  }
}

// Get pixel size ID for an order (dashboard usage).
export async function getContentPixelSizeId(orderId: string): Promise<string> {
  await requireSession()
  try {
    const row = await queryOne<{ pixel_size_id: string | null }>(
      `SELECT pixel_size_id FROM contents WHERE order_id = $1 LIMIT 1`,
      [orderId],
    )
    return row?.pixel_size_id ?? ""
  } catch (e) {
    handleDataError({
      message:
        e instanceof Error ? e.message : "ピクセルサイズ取得に失敗しました",
    })
  }
}

// Get pixel size info.
// Public read — used by both the dashboard and the unauthenticated signage
// display page (`/?areaId=...`). The returned dimensions are not sensitive.
export async function getContentPixelSize(
  pixelSizeId: string,
): Promise<PixelSizeInfo | null> {
  let row: PixelSize | null
  try {
    row = await queryOne<PixelSize>(
      `SELECT id, width, height, pixel_width, pixel_height,
              margin_top, margin_left, display_content_flg, get_pixel_flg
         FROM pixel_sizes
        WHERE id = $1`,
      [pixelSizeId],
    )
  } catch (e) {
    handleDataError({
      message:
        e instanceof Error ? e.message : "ピクセルサイズ取得に失敗しました",
    })
  }
  if (!row) {
    return null
  }
  return {
    width: row.width,
    height: row.height,
    pixelWidth: row.pixel_width,
    pixelHeight: row.pixel_height,
    marginTop: row.margin_top,
    marginLeft: row.margin_left,
    displayContentFlg: row.display_content_flg,
    getPixelFlg: row.get_pixel_flg,
  }
}

// Get content list by coverage area (dashboard usage).
export async function getContentList(
  coverageAreaList: string[],
): Promise<ContentListItem[]> {
  await requireSession()
  if (coverageAreaList.length === 0) {
    return []
  }
  let rows: Content[]
  try {
    rows = await queryRows<Content>(
      `SELECT area_id, area_name, order_id, pixel_size_id, deleted
         FROM contents
        WHERE deleted = false
          AND area_id = ANY($1::text[])`,
      [coverageAreaList],
    )
  } catch (e) {
    handleDataError({
      message: e instanceof Error ? e.message : "コンテンツ取得に失敗しました",
    })
  }
  return rows.map((item) => ({
    areaId: item.area_id,
    areaName: item.area_name,
    orderId: item.order_id,
    pixelSizeId: item.pixel_size_id,
    delete: item.deleted,
  }))
}

// Upsert order. Authenticated.
export async function setContentOrder(
  docId: string,
  content: Partial<Order>,
): Promise<void> {
  await requireSession()
  const set1 = JSON.stringify(content.set1 ?? [])
  const hidden = JSON.stringify(content.hidden ?? [])
  try {
    await query(
      `INSERT INTO orders (id, set1, hidden)
            VALUES ($1, $2::jsonb, $3::jsonb)
       ON CONFLICT (id) DO UPDATE
            SET set1 = EXCLUDED.set1,
                hidden = EXCLUDED.hidden`,
      [docId, set1, hidden],
    )
  } catch (e) {
    handleDataError({
      message: e instanceof Error ? e.message : "オーダー保存に失敗しました",
    })
  }
}

// Update order (partial). Authenticated.
export async function updateContentOrder(
  docId: string,
  content: Partial<Order>,
): Promise<void> {
  await requireSession()
  const fields: string[] = []
  const values: unknown[] = []
  if (content.set1 !== undefined) {
    fields.push(`set1 = $${fields.length + 1}::jsonb`)
    values.push(JSON.stringify(content.set1))
  }
  if (content.hidden !== undefined) {
    fields.push(`hidden = $${fields.length + 1}::jsonb`)
    values.push(JSON.stringify(content.hidden))
  }
  if (fields.length === 0) {
    return
  }
  values.push(docId)
  try {
    await query(
      `UPDATE orders SET ${fields.join(", ")} WHERE id = $${values.length}`,
      values,
    )
  } catch (e) {
    handleDataError({
      message: e instanceof Error ? e.message : "オーダー更新に失敗しました",
    })
  }
}

// Add area in area management. Admin-only.
// Wrapped in a transaction with a row-exclusive lock on `contents` so that
// concurrent admins computing `area_id = COUNT(*)` cannot collide.
export async function createContentsData(areaName: string): Promise<void> {
  await requireAdmin()
  try {
    await withTransaction(async (client) => {
      await client.query("LOCK TABLE contents IN SHARE ROW EXCLUSIVE MODE")
      const orderResult = await client.query<{ id: string }>(
        `INSERT INTO orders (set1, hidden) VALUES ('[]'::jsonb, '[]'::jsonb)
         RETURNING id`,
      )
      const newOrder = orderResult.rows[0]
      if (!newOrder) {
        handleDataError({ message: "オーダー作成に失敗しました" })
      }
      const countResult = await client.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM contents`,
      )
      const count = Number(countResult.rows[0]?.count ?? 0)
      await client.query(
        `INSERT INTO contents (area_id, area_name, order_id, deleted)
              VALUES ($1, $2, $3, false)`,
        [count.toString(), areaName, newOrder.id],
      )
    })
  } catch (e) {
    handleDataError({
      message: e instanceof Error ? e.message : "エリア作成に失敗しました",
    })
  }
}

// Edit area in area management. Admin-only.
export async function updateContentsData(
  index: number,
  contents: ContentListItem[],
  areaName: string,
): Promise<void> {
  await requireAdmin()
  const orderId = contents[index].orderId
  try {
    await query(`UPDATE contents SET area_name = $1 WHERE order_id = $2`, [
      areaName,
      orderId,
    ])
  } catch (e) {
    handleDataError({
      message: e instanceof Error ? e.message : "エリア更新に失敗しました",
    })
  }
}

// Delete area in area management (soft delete). Admin-only.
export async function deleteContentsData(
  index: number,
  contents: ContentListItem[],
): Promise<void> {
  await requireAdmin()
  const orderId = contents[index].orderId
  try {
    await query(`UPDATE contents SET deleted = true WHERE order_id = $1`, [
      orderId,
    ])
  } catch (e) {
    handleDataError({
      message: e instanceof Error ? e.message : "エリア削除に失敗しました",
    })
  }
}
