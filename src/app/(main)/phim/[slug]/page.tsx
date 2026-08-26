import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Play } from 'lucide-react'
import FilmCard from '@/components/film-card'
import FavoriteButton from '@/components/favorite-button'
import { fetchFilm, fetchLatestFilms, searchFilms } from '@/lib/nguonc'
import type { CategoryGroup, EpisodeServer, FilmListItem } from '@/lib/types'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  try {
    const data = await fetchFilm(slug)
    return { title: data.movie.name, description: data.movie.description?.slice(0, 160) }
  } catch {
    return { title: 'Phim' }
  }
}

function flattenCategories(category: Record<string, CategoryGroup>): string[] {
  const names: string[] = []
  for (const group of Object.values(category ?? {})) {
    for (const item of group.list ?? []) names.push(item.name)
  }
  return Array.from(new Set(names))
}

export default async function FilmPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let movie
  try {
    const data = await fetchFilm(slug)
    movie = data.movie
  } catch {
    notFound()
  }

  const categories = flattenCategories(movie.category)
  const casts = (movie.casts ?? '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
  const year = categories.find((c) => /^\d{4}$/.test(c))

  // Related films
  let related: FilmListItem[] = []
  try {
    const guess = movie.name.split(/[:\-–]/)[0].trim()
    const res = await searchFilms(guess, 1)
    related = res.items.filter((f) => f.slug !== slug).slice(0, 12)
  } catch {
    related = []
  }
  if (related.length < 4) {
    try {
      const latest = await fetchLatestFilms(1)
      related = latest.items.filter((f) => f.slug !== slug).slice(0, 12)
    } catch {
      related = []
    }
  }

  return (
    <div>
      {/* Backdrop header — poster trái + nội dung phải trên desktop; xếp dọc gọn trên mobile */}
      <section className="relative -mx-4 overflow-hidden pt-14 sm:-mx-8 sm:pt-16">
        {/* Mobile backdrop: mờ nhẹ phía sau, không full-bleed */}
        <div className="absolute inset-0 sm:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {/* NguonC: poster_url = NGANG (backdrop), thumb_url = DỌC (poster) */}
          <img src={movie.poster_url || movie.thumb_url} alt="" className="h-full w-full object-cover opacity-25 blur-sm" />
          <div className="absolute inset-0 bg-gradient-to-b from-void/60 via-void/85 to-void" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 pb-8 text-center sm:flex-row sm:items-start sm:gap-6 sm:pb-10 sm:text-left">
          <div className="relative aspect-[2/3] w-32 shrink-0 self-center overflow-hidden rounded-lg shadow-xl ring-1 ring-white/15 sm:w-48">
            {/* NguonC: thumb_url = ảnh DỌC 2:3 → khung poster dùng thumb_url */}
            <Image src={movie.thumb_url || movie.poster_url} alt={movie.name} fill sizes="192px" className="object-cover" priority />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] font-bold leading-tight tracking-tight text-paper drop-shadow sm:text-4xl">{movie.name}</h1>
            {movie.original_name && movie.original_name !== movie.name ? (
              <p className="mt-1 text-[13px] text-mist/85 sm:text-[15px]">{movie.original_name}</p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:mt-4 sm:justify-start sm:gap-2">
              {movie.quality ? (
                <span className="rounded-sm bg-acid-lime px-1.5 py-0.5 text-[11px] font-bold text-void sm:px-2 sm:text-[12px]">{movie.quality}</span>
              ) : null}
              {[movie.language, movie.time, movie.current_episode].filter(Boolean).map((chip) => (
                <span key={chip} className="rounded-sm border border-white/25 px-1.5 py-0.5 text-[11px] text-bone backdrop-blur-sm sm:px-2 sm:text-[12px]">
                  {chip}
                </span>
              ))}
              {year ? <span className="text-[13px] font-medium text-fog">{year}</span> : null}
            </div>

            {categories.filter((c) => !/^\d{4}$/.test(c)).length > 0 ? (
              <p className="mt-2 flex flex-wrap items-center justify-center gap-x-2 text-[12px] text-fog sm:mt-3 sm:justify-start sm:text-[13px]">
                {categories
                  .filter((c) => !/^\d{4}$/.test(c))
                  .slice(0, 5)
                  .map((cat, i) => (
                    <span key={cat}>
                      {i > 0 ? <span className="mr-2 text-ash">•</span> : null}
                      {cat}
                    </span>
                  ))}
              </p>
            ) : null}

            <p className="mt-3 text-[13px] leading-relaxed text-mist [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4] overflow-hidden sm:mt-5 sm:text-[15px] sm:[-webkit-line-clamp:5]">
              {(movie.description || '').replace(/<[^>]*>/g, '')}
            </p>

            {casts.length > 0 ? (
              <p className="mt-3 hidden text-[12px] leading-relaxed text-fog sm:block sm:text-[13px]">
                <span className="font-semibold text-mist">Diễn viên: </span>
                {casts.slice(0, 5).join(', ')}
              </p>
            ) : null}
            {movie.director ? (
              <p className="mt-1 hidden text-[12px] text-fog sm:block sm:text-[13px]">
                <span className="font-semibold text-mist">Đạo diễn: </span>
                {movie.director}
              </p>
            ) : null}

            <div className="mt-4 sm:mt-7">
              <div className="flex items-center justify-center gap-2.5 sm:justify-start">
                {movie.episodes[0]?.items?.length ? (
                  <Link
                    href={`/xem/${slug}?ep=${encodeURIComponent(movie.episodes[0].items[0].slug)}`}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-acid-lime px-7 text-[14px] font-semibold text-void transition-opacity hover:opacity-90 sm:h-11 sm:flex-none sm:text-[15px]"
                  >
                    <Play size={16} strokeWidth={2.5} fill="currentColor" aria-hidden />
                    Xem ngay
                  </Link>
                ) : (
                  <span className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-white/20 px-5 text-[13px] text-ash sm:flex-none sm:text-[14px]">
                    Sắp ra mắt
                  </span>
                )}
                <FavoriteButton slug={slug} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Episodes by server */}
      {movie.episodes.some((s) => s.items.length > 0) ? (
        <section className="mt-8 space-y-7 sm:mt-10 sm:space-y-8">
          {movie.episodes.map((server: EpisodeServer) =>
            server.items.length > 0 ? (
              <div key={server.server_name}>
                <h2 className="mb-2.5 text-[16px] font-semibold tracking-tight text-paper sm:mb-3 sm:text-[18px]">{server.server_name}</h2>
                <div className="flex flex-wrap gap-2">
                  {server.items.map((ep) => (
                    <Link
                      key={`${server.server_name}-${ep.slug}`}
                      href={`/xem/${slug}?sv=${encodeURIComponent(server.server_name)}&ep=${encodeURIComponent(ep.slug)}`}
                      className="inline-flex h-9 min-w-12 items-center justify-center rounded-md bg-white/5 px-2.5 text-[13px] text-mist transition-colors hover:bg-white/20 hover:text-paper"
                    >
                      {ep.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null,
          )}
        </section>
      ) : null}

      {/* Related */}
      {related.length > 0 ? (
        <section className="mt-10 sm:mt-12">
          <h2 className="mb-2.5 text-[17px] font-semibold tracking-tight text-paper sm:mb-3 sm:text-[20px]">Có thể bạn cũng thích</h2>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 sm:gap-3">
            {related.map((film) => (
              <FilmCard key={film.slug} film={film} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
