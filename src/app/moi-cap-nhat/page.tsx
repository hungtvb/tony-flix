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
    <div className="pt-10">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[32px] font-medium tracking-tight text-paper">Mới cập nhật</h1>
        {data ? (
          <span className="font-mono text-[12px] text-ash">
            trang {data.paginate.current_page}/{data.paginate.total_page}
          </span>
        ) : null}
      </div>
      {!data ? (
        <p className="rounded-lg border border-graphite bg-carbon px-4 py-6 text-center text-[14px] text-fog">
          Nguồn phim đang bận (Cloudflare chặn IP server). Vui lòng tải lại trang sau vài giây.
        </p>
      ) : (
      <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
