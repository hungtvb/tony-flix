import FilmCard from '@/components/film-card'
import Pagination from '@/components/pagination'
import { fetchLatestFilms } from '@/lib/nguonc'

export const revalidate = 60

export default async function LatestPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1)
  let data: Awaited<ReturnType<typeof fetchLatestFilms>> | null = null
  try {
    data = await fetchLatestFilms(page)
  } catch {
    data = null
  }

  return (
    <div className="pt-24">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[28px] font-bold tracking-tight text-paper">Mới cập nhật</h1>
        {data ? (
          <span className="text-[13px] text-fog">
            Trang {data.paginate.current_page}/{data.paginate.total_page}
          </span>
        ) : null}
      </div>
      {!data ? (
        <p className="rounded-lg bg-carbon px-4 py-8 text-center text-[14px] text-fog">
          Đang tải phim. Vui lòng thử lại sau ít phút.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 sm:gap-3">
            {data.items.map((film) => (
              <FilmCard key={film.slug} film={film} />
            ))}
          </div>
          <Pagination paginate={data.paginate} basePath="/moi-cap-nhat" />
        </>
      )}
    </div>
  )
}
