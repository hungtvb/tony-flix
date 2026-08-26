import { NextRequest, NextResponse } from 'next/server'
import {
  ensureProgressSchema,
  upsertWatchProgress,
  listWatchProgress,
} from '@/lib/db'
import { currentUser } from '@/lib/auth'
import { fetchLatestFilms } from '@/lib/nguonc'
import type { FilmListItem } from '@/lib/types'

/**
 * POST /api/tien-do { slug, episode, serverName } — ghi tiến độ xem (upsert)
 * GET  /api/tien-do                — top 20 phim đang xem dở (mới nhất trước)
 *
 * Tiến độ theo CẤP TẬP (player là iframe cross-origin — không đọc được phút).
 * Auth bắt buộc qua middleware.
 */

const LIMIT = 20

interface ProgressItem {
  slug: string
  name: string
  posterUrl: string
  episode: string
  serverName: string
  updatedAt: string
}

async function requireUser(): Promise<string | null> {
  try {
    return await currentUser()
  } catch {
    return null
  }
}

function noDbError(error: unknown): boolean {
  return (error as { code?: string }).code === 'NO_DB'
}

export async function GET(request: NextRequest) {
  const username = await requireUser()
  if (!username) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  try {
    await ensureProgressSchema()
    const rows = await listWatchProgress(username, LIMIT)

    // Làm giàu tên + poster từ NguonC latest (fail mềm — upstream chết vẫn trả danh sách)
    const index = new Map<string, FilmListItem>()
    if (rows.length > 0) {
      await Promise.all(
        [1, 2, 3].map(async (p) => {
          try {
            const res = await fetchLatestFilms(p)
            for (const film of res.items) index.set(film.slug, film)
          } catch {
            // bỏ qua
          }
        }),
      )
    }

    const items: ProgressItem[] = rows.map((row) => {
      const film = index.get(row.filmSlug)
      return {
        slug: row.filmSlug,
        name: film?.name ?? row.filmSlug,
        posterUrl: film?.poster_url || film?.thumb_url || '',
        episode: row.episode,
        serverName: row.serverName,
        updatedAt: new Date(row.updatedAt).toISOString(),
      }
    })
    return NextResponse.json({ items })
  } catch (error) {
    if (noDbError(error)) {
      return NextResponse.json(
        { error: 'Chưa cấu hình cơ sở dữ liệu — chưa có tiến độ xem.' },
        { status: 503 },
      )
    }
    void request
    return NextResponse.json(
      { error: 'Không tải được tiến độ xem. Thử lại sau.' },
      { status: 503 },
    )
  }
}

export async function POST(request: NextRequest) {
  const username = await requireUser()
  if (!username) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  let body: { slug?: unknown; episode?: unknown; serverName?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 })
  }

  const slug = typeof body.slug === 'string' ? body.slug.trim() : ''
  const episode = typeof body.episode === 'string' ? body.episode.trim() : ''
  const serverName = typeof body.serverName === 'string' ? body.serverName.trim() : ''
  if (!slug || slug.length > 200 || !episode || episode.length > 100 || !serverName || serverName.length > 100) {
    return NextResponse.json({ error: 'Thiếu hoặc sai dữ liệu tiến độ.' }, { status: 400 })
  }

  try {
    await ensureProgressSchema()
    await upsertWatchProgress(username, slug, episode, serverName)
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    if (noDbError(error)) {
      return NextResponse.json(
        { error: 'Chưa cấu hình cơ sở dữ liệu — không thể lưu tiến độ.' },
        { status: 503 },
      )
    }
    return NextResponse.json(
      { error: 'Không lưu được tiến độ. Thử lại sau.' },
      { status: 503 },
    )
  }
}
