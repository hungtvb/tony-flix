import Link from 'next/link'
import FilmCard from '@/components/film-card'
import { fetchLatestFilms } from '@/lib/nguonc'
import type { FilmListItem } from '@/lib/types'

export const revalidate = 60

export default async function HomePage() {
  let data: Awaited<ReturnType<typeof fetchLatestFilms>> | null = null
  try {
    data = await fetchLatestFilms(1)
  } catch {
    data = null
  }
  const hero = data?.items[0]
  const rest: FilmListItem[] = data ? data.items.slice(1) : []

  return (
    <div className="pt-10">
      {/* Hero — left-aligned oversized headline, Linear style */}
      <section className="pb-16">
        <h1 className="max-w-3xl text-4xl font-medium leading-[1.05] tracking-tight text-paper sm:text-[56px]">
          Xem phim <span className="text-acid-lime">HD Vietsub</span>, mượt như đêm code chạy pass lần đầu.
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-fog">
          Phim bộ, phim lẻ, anime — cập nhật liên tục từ NguonC. Không quảng cáo lộn xộn, chỉ có phim.
        </p>
        <div className="mt-6 flex items-center gap-4">
          {hero ? (
            <Link
              href={`/phim/${hero.slug}`}
              className="rounded-md bg-acid-lime px-4 py-2.5 text-[14px] font-medium text-void transition-opacity hover:opacity-90"
            >
              ▶ Xem: {hero.name}
            </Link>
          ) : null}
          <a href="#moi-cap-nhat" className="text-[14px] text-mist underline-offset-4 hover:text-paper hover:underline">
            Khám phá thêm →
          </a>
        </div>
      </section>

      {/* Latest films grid */}
      <section id="moi-cap-nhat" className="scroll-mt-20">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-[24px] font-medium tracking-tight text-paper">Mới cập nhật</h2>
          <span className="font-mono text-[12px] text-ash">
            {data ? `${data.paginate.total_items.toLocaleString('vi-VN')} phim` : '—'}
          </span>
        </div>
        {!data ? (
          <p className="rounded-lg border border-graphite bg-carbon px-4 py-6 text-center text-[14px] text-fog">
            Nguồn phim đang bận (Cloudflare chặn IP server). Vui lòng tải lại trang sau vài giây.
          </p>
        ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {(hero ? rest : data.items).map((film) => (
            <FilmCard key={film.slug} film={film} />
          ))}
        </div>
        )}
        <div className="mt-8 text-center">
          <Link
            href="/moi-cap-nhat"
            className="inline-flex h-9 items-center rounded-md border border-graphite px-4 text-[13px] text-mist transition-colors hover:border-smoke hover:text-paper"
          >
            Xem tất cả →
          </Link>
        </div>
      </section>
    </div>
  )
}
