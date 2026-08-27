import { NextRequest, NextResponse } from 'next/server'
import {
  ensureFavoritesSchema,
  listFavoritesPage,
  addFavorite,
  removeFavorite,
  isFavorite,
} from '@/lib/db'
import { currentUser } from '@/lib/auth'
import { fetchFilm } from '@/lib/nguonc'
import type { FilmListItem } from '@/lib/types'

/**
 * POST /api/yeu-thich  { slug }        — thêm phim yêu thích
 * DELETE /api/yeu-thich { slug }       — bỏ yêu thích
 * GET  /api/yeu-thich?page=N           — danh sách yêu thích (mới nhất trước)
 *
 * Auth bắt buộc: middleware chặn mọi route ngoài PUBLIC_PATHS, nên tới đây
 * request luôn có session hợp lệ (currentUser() chỉ là phòng hờ).
 */

const PAGE_SIZE = 24

/** Item trả về cho client — slug luôn có, name/poster làm giàu từ NguonC khi được. */
interface FavoriteItem {
  slug: string
  name: string
  posterUrl: string
  addedAt: string
}

function parsePage(value: string | null): number {
  const n = Number.parseInt(value ?? '1', 10)
  return Number.isFinite(n) && n > 0 ? Math.min(n, 500) : 1
}

function noDbError(error: unknown): boolean {
  return (error as { code?: string }).code === 'NO_DB'
}

async function requireUser(request: NextRequest): Promise<string | null> {
  try {
    return await currentUser()
  } catch {
    void request
    return null
  }
}

/** Làm giàu danh sách slug với tên + poster từ chi tiết phim NguonC. Fail mềm. */
async function enrichWithFilms(slugs: string[]): Promise<Map<string, FilmListItem>> {
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
        // phim không tìm thấy → bỏ qua
      }
    }),
  )
  return index
}

export async function GET(request: NextRequest) {
  const username = await requireUser(request)
  if (!username) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  // Chế độ kiểm tra nhanh cho nút tim: /api/yeu-thich?slug=<x> → {favorited}
  const single = request.nextUrl.searchParams.get('slug')
  if (single) {
    try {
      await ensureFavoritesSchema()
      return NextResponse.json({ favorited: await isFavorite(username, single) })
    } catch {
      return NextResponse.json({ error: 'Không kiểm tra được yêu thích.' }, { status: 503 })
    }
  }

  const page = parsePage(request.nextUrl.searchParams.get('page'))
  try {
    await ensureFavoritesSchema()
    const { items, total } = await listFavoritesPage(username, page, PAGE_SIZE)
    const index = await enrichWithFilms(items.map((i) => i.filmSlug))
    const outItems: FavoriteItem[] = items.map((row) => {
      const film = index.get(row.filmSlug)
      return {
        slug: row.filmSlug,
        name: film?.name ?? row.filmSlug,
        posterUrl: film?.poster_url || film?.thumb_url || '',
        addedAt: new Date(row.createdAt).toISOString(),
      }
    })
    return NextResponse.json({
      items: outItems,
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    })
  } catch (error) {
    if (noDbError(error)) {
      return NextResponse.json(
        { error: 'Chưa cấu hình cơ sở dữ liệu — chưa lưu được yêu thích nào.' },
        { status: 503 },
      )
    }
    return NextResponse.json(
      { error: 'Không tải được danh sách yêu thích. Thử lại sau.' },
      { status: 503 },
    )
  }
}

export async function POST(request: NextRequest) {
  const username = await requireUser(request)
  if (!username) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  let body: { slug?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 })
  }

  const slug = typeof body.slug === 'string' ? body.slug.trim() : ''
  if (!slug || slug.length > 200) {
    return NextResponse.json({ error: 'Thiếu hoặc sai mã phim.' }, { status: 400 })
  }

  try {
    await ensureFavoritesSchema()
    const added = await addFavorite(username, slug)
    return NextResponse.json({ ok: true, already: !added }, { status: added ? 201 : 200 })
  } catch (error) {
    if (noDbError(error)) {
      return NextResponse.json(
        { error: 'Chưa cấu hình cơ sở dữ liệu — không thể lưu yêu thích.' },
        { status: 503 },
      )
    }
    return NextResponse.json(
      { error: 'Không lưu được yêu thích. Thử lại sau.' },
      { status: 503 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  const username = await requireUser(request)
  if (!username) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  let body: { slug?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 })
  }

  const slug = typeof body.slug === 'string' ? body.slug.trim() : ''
  if (!slug || slug.length > 200) {
    return NextResponse.json({ error: 'Thiếu hoặc sai mã phim.' }, { status: 400 })
  }

  try {
    await ensureFavoritesSchema()
    await removeFavorite(username, slug)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (noDbError(error)) {
      return NextResponse.json(
        { error: 'Chưa cấu hình cơ sở dữ liệu.' },
        { status: 503 },
      )
    }
    return NextResponse.json(
      { error: 'Không bỏ được yêu thích. Thử lại sau.' },
      { status: 503 },
    )
  }
}
