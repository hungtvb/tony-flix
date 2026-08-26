import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { Heart } from 'lucide-react'
import FilmCard from '@/components/film-card'
import { ensureFavoritesSchema, listFavoritesPage } from '@/lib/db'
import { currentUser } from '@/lib/auth'
import { fetchLatestFilms } from '@/lib/nguonc'
import type { FilmListItem } from '@/lib/types'

/**
 * Trang danh sách phim yêu thích của user đang đăng nhập.
 * Dữ liệu theo từng user nên KHÔNG được cache ISR — force-dynamic.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Yêu thích' }

const PAGE_SIZE = 24

/** Card thay thế khi không làm giàu được info từ NguonC (phim cũ/hết dữ liệu). */
function UnknownFilmCard({ slug }: { slug: string }) {
  return (
    <Link
      href={`/phim/${slug}`}
      className="flex aspect-[2/3] flex-col items-center justify-center gap-2 rounded-lg bg-carbon p-3 text-center ring-1 ring-white/5 transition-transform hover:scale-[1.03]"
    >
      <Heart size={18} className="text-ash" aria-hidden />
      <span className="line-clamp-3 break-all text-[12px] font-medium leading-snug text-paper">{slug}</span>
      <span className="text-[11px] text-ash">Không có ảnh xem trước</span>
    </Link>
  )
}

export default async function FavoritesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1)

  const username = await currentUser()
  if (!username) redirect('/dang-nhap?next=/yeu-thich')

  let rows: Awaited<ReturnType<typeof listFavoritesPage>>['items'] = []
  let total = 0
  let dbDown = false
  try {
    await ensureFavoritesSchema()
    const result = await listFavoritesPage(username, page, PAGE_SIZE)
    rows = result.items
    total = result.total
  } catch {
    dbDown = true
  }

  // Làm giàu tên + poster từ các trang latest (fail mềm — thiếu thì dùng card dự phòng)
  const index = new Map<string, FilmListItem>()
  if (rows.length > 0) {
    await Promise.all(
      [1, 2, 3].map(async (p) => {
        try {
          const res = await fetchLatestFilms(p)
          for (const film of res.items) index.set(film.slug, film)
        } catch {
          // upstream chết vẫn hiển thị danh sách
        }
      }),
    )
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="pt-24">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[28px] font-bold tracking-tight text-paper">Yêu thích</h1>
        {total > 0 ? <span className="text-[13px] text-fog">{total} phim</span> : null}
      </div>

      {dbDown ? (
        <p className="rounded-lg bg-carbon px-4 py-8 text-center text-[14px] text-fog">
          Chưa tải được danh sách. Vui lòng thử lại sau ít phút.
        </p>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg bg-carbon px-4 py-14 text-center">
          <Heart size={36} className="text-ash" aria-hidden />
          <p className="text-[15px] font-medium text-paper">Chưa có phim yêu thích</p>
          <p className="max-w-xs text-[13px] leading-relaxed text-fog">
            Bấm biểu tượng trái tim ở trang phim để lưu vào danh sách của bạn.
          </p>
          <Link
            href="/"
            className="mt-1 inline-flex h-9 items-center rounded-md bg-acid-lime px-4 text-[13px] font-semibold text-void transition-opacity hover:opacity-90"
          >
            Khám phá phim
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 sm:gap-3">
            {rows.map((row) => {
              const film = index.get(row.filmSlug)
              return film ? (
                <FilmCard key={row.filmSlug} film={film} />
              ) : (
                <UnknownFilmCard key={row.filmSlug} slug={row.filmSlug} />
              )
            })}
          </div>

          {totalPages > 1 ? (
            <nav className="mt-7 flex items-center justify-center gap-4" aria-label="Phân trang">
              {page > 1 ? (
                <Link
                  href={`/yeu-thich?page=${page - 1}`}
                  className="inline-flex h-9 items-center rounded-md bg-carbon px-4 text-[13px] text-bone transition-colors hover:text-paper"
                >
                  Trang trước
                </Link>
              ) : null}
              <span className="text-[13px] text-fog">
                Trang {page}/{totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={`/yeu-thich?page=${page + 1}`}
                  className="inline-flex h-9 items-center rounded-md bg-carbon px-4 text-[13px] text-bone transition-colors hover:text-paper"
                >
                  Trang sau
                </Link>
              ) : null}
            </nav>
          ) : null}
        </>
      )}
    </div>
  )
}
