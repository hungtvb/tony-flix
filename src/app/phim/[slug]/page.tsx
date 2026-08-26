import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Play } from 'lucide-react'
import FilmCard from '@/components/film-card'
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
    <div className="">
      {/* Backdrop header — Netflix detail style */}
      <section className="relative -mx-4 -mt-16 overflow-hidden sm:-mx-8">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={movie.thumb_url || movie.poster_url} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-void via-void/85 to-void/40" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-void to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 px-4 pb-10 pt-28 sm:flex-row sm:px-8">
          <div className="relative aspect-[2/3] w-36 shrink-0 self-start overflow-hidden rounded-lg shadow-xl ring-1 ring-white/15 sm:w-48">
            <Image src={movie.poster_url || movie.thumb_url} alt={movie.name} fill sizes="192px" className="object-cover" priority />
          </div>

          <div className="min-w-0 max-w-2xl flex-1">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-paper drop-shadow sm:text-4xl">{movie.name}</h1>
            {movie.original_name && movie.original_name !== movie.name ? (
              <p className="mt-1 text-[15px] text-mist/85">{movie.original_name}</p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {movie.quality ? (
                <span className="rounded-sm bg-acid-lime px-2 py-0.5 text-[12px] font-bold text-paper">{movie.quality}</span>
              ) : null}
              {[movie.language, movie.time, movie.current_episode].filter(Boolean).map((chip) => (
                <span key={chip} className="rounded-sm border border-white/25 px-2 py-0.5 text-[12px] text-bone backdrop-blur-sm">
                  {chip}
                </span>
              ))}
              {year ? <span className="text-[13px] font-medium text-fog">{year}</span> : null}
            </div>

            {categories.filter((c) => !/^\d{4}$/.test(c)).length > 0 ? (
              <p className="mt-3 flex flex-wrap items-center gap-x-2 text-[13px] text-fog">
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

            <p className="mt-5 text-[15px] leading-relaxed text-mist [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:5] overflow-hidden">
              {(movie.description || '').replace(/<[^>]*>/g, '')}
            </p>

            {casts.length > 0 ? (
              <p className="mt-4 text-[13px] leading-relaxed text-fog">
                <span className="font-semibold text-mist">Diễn viên: </span>
                {casts.slice(0, 5).join(', ')}
              </p>
            ) : null}
            {movie.director ? (
              <p className="mt-1 text-[13px] text-fog">
                <span className="font-semibold text-mist">Đạo diễn: </span>
                {movie.director}
              </p>
            ) : null}

            <div className="mt-7">
              {movie.episodes[0]?.items?.length ? (
                <Link
                  href={`/xem/${slug}?ep=${encodeURIComponent(movie.episodes[0].items[0].slug)}`}
                  className="mt-7 inline-flex h-11 items-center gap-2 rounded-md bg-acid-lime px-7 text-[15px] font-semibold text-void transition-opacity hover:opacity-90"
                >
                  <Play size={16} strokeWidth={2.5} fill="currentColor" aria-hidden />
                  Xem ngay
                </Link>
              ) : (
                <span className="inline-flex h-11 items-center rounded border border-white/20 px-5 text-[14px] text-ash">
                  Sắp ra mắt
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Episodes by server */}
      {movie.episodes.some((s) => s.items.length > 0) ? (
        <section className="mt-10 space-y-8">
          {movie.episodes.map((server: EpisodeServer) =>
            server.items.length > 0 ? (
              <div key={server.server_name}>
                <h2 className="mb-3 text-[16px] font-semibold tracking-tight text-paper">{server.server_name}</h2>
                <div className="flex flex-wrap gap-2">
                  {server.items.map((ep) => (
                    <Link
                      key={`${server.server_name}-${ep.slug}`}
                      href={`/xem/${slug}?sv=${encodeURIComponent(server.server_name)}&ep=${encodeURIComponent(ep.slug)}`}
                      className="inline-flex h-9 min-w-14 items-center justify-center rounded bg-white/5 px-3 text-[13px] text-mist transition-colors hover:bg-white/20 hover:text-paper"
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
        <section className="mt-12">
          <h2 className="mb-3 text-[20px] font-semibold tracking-tight text-paper">Có thể bạn cũng thích</h2>
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
