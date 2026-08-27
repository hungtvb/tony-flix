import { NextRequest, NextResponse } from 'next/server'
import { ensureFavoritesSchema, listFavoritesPage } from '@/lib/db'
import { fetchFilm } from '@/lib/nguonc'
import { proxyCacheHeaders } from '@/lib/cache'
import type { FilmListItem } from '@/lib/types'

/**
 * GET /api/yeu-thich/[user]?page=N — danh sách phim yêu thích PUBLIC của 1 user
 * (không cần đăng nhập). Dùng để share watchlist.
 */
const PAGE_SIZE = 24

function parsePage(value: string | null): number {
  const n = Number.parseInt(value ?? '1', 10)
  return Number.isFinite(n) && n > 0 ? Math.min(n, 500) : 1
}

async function enrich(slugs: string[]): Promise<Map<string, FilmListItem>> {
  const index = new Map<string, FilmListItem>()
  await Promise.all(
    slugs.map(async (slug) => {
      try {
        const detail = await fetchFilm(slug)
        if (detail?.movie) {
          index.set(slug, {
            slug,
            name: detail.movie.name ?? slug,
            poster_url: detail.movie.poster_url || '',
            thumb_url: detail.movie.thumb_url || '',
          } as FilmListItem)
        }
      } catch {
        // ignore
      }
    }),
  )
  return index
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ user: string }> },
) {
  const { user } = await params
  const page = parsePage(request.nextUrl.searchParams.get('page'))
  try {
    await ensureFavoritesSchema()
    const { items, total } = await listFavoritesPage(user, page, PAGE_SIZE)
    const index = await enrich(items.map((i) => i.filmSlug))
    const out = items.map((row) => {
      const film = index.get(row.filmSlug)
      return {
        slug: row.filmSlug,
        name: film?.name ?? row.filmSlug,
        posterUrl: film?.poster_url || film?.thumb_url || '',
        addedAt: new Date(row.createdAt).toISOString(),
      }
    })
    return NextResponse.json({
      user,
      items: out,
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    }, { headers: proxyCacheHeaders(300) })
  } catch {
    return NextResponse.json({ error: 'Không tải được danh sách.' }, { status: 503 })
  }
}
