import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { listCuratedFilms, upsertCuratedFilm, removeCuratedFilm } from '@/lib/db'
import { fetchFilm } from '@/lib/nguonc'

/**
 * GET  /api/admin/curated        → danh sách Editor's picks (admin).
 * POST /api/admin/curated         → thêm / cập nhật 1 phim (body: slug, note?, position?).
 * DELETE /api/admin/curated?slug= → xoá 1 phim.
 * Tất cả requireAdmin.
 */
export async function GET() {
  try {
    await requireAdmin({ api: true })
    const films = await listCuratedFilms()
    return NextResponse.json({ films })
  } catch (err) {
    const e = err as { status?: number }
    const status = e?.status ?? 500
    return NextResponse.json({ error: status === 401 ? 'unauthenticated' : 'forbidden' }, { status })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin({ api: true })
    const body = (await request.json().catch(() => ({}))) as {
      slug?: string
      note?: string
      position?: number
    }
    const slug = (body.slug ?? '').trim()
    if (!slug) {
      return NextResponse.json({ error: 'slug required' }, { status: 400 })
    }

    // Enrich title + poster từ NguonC để trang chủ render luôn không cần gọi API ngoài.
    let title = slug
    let poster = ''
    try {
      const detail = await fetchFilm(slug)
      title = detail.movie.name
      // FilmCard dùng thumb_url (ảnh DỌC 2:3) → lưu vào poster cho đồng nhất.
      poster = detail.movie.thumb_url || detail.movie.poster_url || ''
    } catch {
      // Nếu NguonC lỗi, vẫn lưu slug làm title để admin sửa sau.
      title = slug
    }

    const row = await upsertCuratedFilm({
      filmSlug: slug,
      title,
      poster,
      note: (body.note ?? '').trim().slice(0, 280),
      position: typeof body.position === 'number' ? body.position : undefined,
    })
    return NextResponse.json({ ok: true, film: row })
  } catch (err) {
    const e = err as { status?: number }
    const status = e?.status ?? 500
    return NextResponse.json({ error: status === 401 ? 'unauthenticated' : 'forbidden' }, { status })
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin({ api: true })
    const url = new URL(request.url)
    const slug = (url.searchParams.get('slug') ?? '').trim()
    if (!slug) {
      return NextResponse.json({ error: 'slug required' }, { status: 400 })
    }
    const ok = await removeCuratedFilm(slug)
    if (!ok) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const e = err as { status?: number }
    const status = e?.status ?? 500
    return NextResponse.json({ error: status === 401 ? 'unauthenticated' : 'forbidden' }, { status })
  }
}
