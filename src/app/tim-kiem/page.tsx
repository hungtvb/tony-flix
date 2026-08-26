import type { Metadata } from 'next'
import FilmCard from '@/components/film-card'
import Pagination from '@/components/pagination'
import { searchFilms } from '@/lib/nguonc'

export const metadata: Metadata = { title: 'Tìm kiếm' }

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ keyword?: string; page?: string }>
}) {
  const params = await searchParams
  const keyword = (params.keyword ?? '').trim()
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1)

  let data: Awaited<ReturnType<typeof searchFilms>> | null = null
  try {
    data = keyword ? await searchFilms(keyword, page) : null
  } catch {
    data = null
  }

  return (
    <div className="pt-24">
      <h1 className="text-[28px] font-bold tracking-tight text-paper">
        {keyword ? (
          <>
            Kết quả cho <span className="text-acid-lime">“{keyword}”</span>
          </>
        ) : (
          'Tìm phim'
        )}
      </h1>

      {!keyword ? (
        <p className="mt-5 text-[15px] text-fog">Nhập tên phim vào ô tìm kiếm phía trên.</p>
      ) : !data || data.items.length === 0 ? (
        <p className="mt-5 text-[15px] text-fog">Không tìm thấy phim nào khớp “{keyword}”.</p>
      ) : (
        <>
          <p className="mt-2 text-[13px] text-fog">
            {data.paginate.total_items.toLocaleString('vi-VN')} kết quả · Trang{' '}
            {data.paginate.current_page}/{data.paginate.total_page}
          </p>
          <div className="mt-6 grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 sm:gap-3">
            {data.items.map((film) => (
              <FilmCard key={film.slug} film={film} />
            ))}
          </div>
          <Pagination paginate={data.paginate} basePath="/tim-kiem" query={{ keyword }} />
        </>
      )}
    </div>
  )
}
