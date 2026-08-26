import FilmCard from '@/components/film-card'
import Pagination from '@/components/pagination'
import { displayName } from '@/lib/categories'

/**
 * Trang duyệt theo danh mục dùng chung cho /the-loai, /quoc-gia, /nam-phat-hanh.
 * Fetcher nhận (page) và trả FilmListResponse.
 */
export default async function CategoryBrowser({
  title,
  basePath,
  page,
  fetcher,
}: {
  title: string
  basePath: string
  page: number
  fetcher: (page: number) => Promise<{ items: import('@/lib/types').FilmListItem[]; paginate: import('@/lib/types').Paginate }>
}) {
  let data: Awaited<ReturnType<typeof fetcher>> | null = null
  try {
    data = await fetcher(page)
  } catch {
    data = null
  }

  return (
    <div className="pt-24">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[28px] font-bold tracking-tight text-paper">{title}</h1>
        {data ? (
          <span className="text-[13px] text-fog">
            Trang {data.paginate.current_page}/{data.paginate.total_page}
          </span>
        ) : null}
      </div>

      {!data || data.items.length === 0 ? (
        <p className="rounded-lg bg-carbon px-4 py-8 text-center text-[14px] text-fog">
          {data ? 'Chưa có phim trong mục này.' : 'Đang tải phim. Vui lòng thử lại sau ít phút.'}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 sm:gap-3">
            {data.items.map((film) => (
              <FilmCard key={film.slug} film={film} />
            ))}
          </div>
          <Pagination paginate={data.paginate} basePath={basePath} />
        </>
      )}
    </div>
  )
}

export { displayName }
