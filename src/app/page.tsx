import Link from 'next/link'
import FilmCard from '@/components/film-card'
import { fetchLatestFilms } from '@/lib/nguonc'
import type { FilmListItem } from '@/lib/types'

export const revalidate = 60

/** Horizontal scrolling film row, Netflix style. */
function FilmRow({ title, films }: { title: string; films: FilmListItem[] }) {
  if (films.length === 0) return null
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-[20px] font-semibold tracking-tight text-paper">{title}</h2>
      <div className="no-scrollbar -mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-2 sm:gap-3">
        {films.map((film) => (
          <div key={film.slug} className="w-[132px] shrink-0 snap-start sm:w-[152px] md:w-[168px]">
            <FilmCard film={film} />
          </div>
        ))}
      </div>
    </section>
  )
}

export default async function HomePage() {
  let items: FilmListItem[] = []
  try {
    const data = await fetchLatestFilms(1)
    items = data.items
  } catch {
    items = []
  }

  const hero = items[0]
  const rest: FilmListItem[] = items.slice(1)

  return (
    <div>
      {/* Billboard hero — full-width backdrop like Netflix */}
      <section className="relative -mx-4 -mt-14 flex min-h-[62vh] items-end overflow-hidden sm:min-h-[72vh]">
        {hero ? (
          <>
            <div className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={hero.thumb_url || hero.poster_url} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-void via-void/70 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-void to-transparent" />
            </div>
            <div className="relative z-10 max-w-xl px-4 pb-16 pt-32">
              <p className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-fog">
                <span className="inline-block h-4 w-1 rounded-full bg-acid-lime" />
                {hero.quality ? hero.quality : 'Đề xuất hôm nay'}
              </p>
              <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-paper drop-shadow-lg sm:text-5xl">
                {hero.name}
              </h1>
              <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-mist/90 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden">
                {(hero.description || '').replace(/<[^>]*>/g, '').slice(0, 220)}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href={`/xem/${hero.slug}`}
                  className="inline-flex h-11 items-center gap-2 rounded bg-paper px-6 text-[15px] font-semibold text-void transition-colors hover:bg-white/80"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M8 5.14v13.72L19 12 8 5.14z" />
                  </svg>
                  Xem ngay
                </Link>
                <Link
                  href={`/phim/${hero.slug}`}
                  className="inline-flex h-11 items-center gap-2 rounded bg-white/20 px-5 text-[15px] font-medium text-paper backdrop-blur-sm transition-colors hover:bg-white/30"
                >
                  ℹ Thông tin
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="relative z-10 px-4 py-28">
            <h1 className="text-4xl font-bold tracking-tight text-paper">TonyFlix</h1>
            <p className="mt-3 text-[15px] text-fog">Đang cập nhật phim — thử tải lại trang sau vài giây.</p>
          </div>
        )}
      </section>

      {/* Rows */}
      <div className="pb-8">
        <FilmRow title="Mới cập nhật" films={rest} />
      </div>
    </div>
  )
}
