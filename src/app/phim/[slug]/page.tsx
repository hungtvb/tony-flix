import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
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

  // Related: same first category keyword via search, fallback latest
  let related: FilmListItem[] = []
  let relatedTitle = 'Mới cập nhật'
  const primaryGenre = categories.find((c) => !/phim bộ|phim lẻ|tv shows|hoạt hình/i.test(c))
  try {
    if (primaryGenre) {
      const res = await searchFilms(primaryGenre, 1)
      related = res.items.filter((f) => f.slug !== slug).slice(0, 5)
      if (related.length >= 3) relatedTitle = `Liên quan · ${primaryGenre}`
    }
  } catch {
    /* fall through */
  }
  if (related.length < 3) {
    const latest = await fetchLatestFilms(1)
    related = latest.items.filter((f) => f.slug !== slug).slice(0, 5)
    relatedTitle = 'Có thể bạn thích'
  }

  return (
    <div className="pt-8">
      {/* Detail header */}
      <section className="flex flex-col gap-6 sm:flex-row">
        <div className="relative aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-xl ring-1 ring-graphite sm:w-52">
          <Image src={movie.poster_url || movie.thumb_url} alt={movie.name} fill sizes="208px" className="object-cover" priority />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[32px] font-medium leading-tight tracking-tight text-paper">{movie.name}</h1>
          <p className="mt-1 text-[15px] text-fog">{movie.original_name}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {[movie.quality, movie.language, movie.time, movie.current_episode].filter(Boolean).map((chip) => (
              <span key={chip} className="rounded bg-white/5 px-2 py-0.5 text-[12px] text-fog">
                {chip}
              </span>
            ))}
            {categories
              .filter((c) => !/^\d{4}$/.test(c))
              .slice(0, 6)
              .map((cat) => (
                <span key={cat} className="rounded bg-iris-violet/15 px-2 py-0.5 text-[12px] text-lavender">
                  {cat}
                </span>
              ))}
            {categories.find((c) => /^\d{4}$/.test(c)) ? (
              <span className="rounded bg-white/5 px-2 py-0.5 text-[12px] text-fog">
                {categories.find((c) => /^\d{4}$/.test(c))}
              </span>
            ) : null}
          </div>

          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-mist">{movie.description}</p>

          {casts.length > 0 ? (
            <p className="mt-4 max-w-2xl text-[13px] leading-relaxed text-fog">
              <span className="text-ash">Diễn viên:</span> {casts.join(', ')}
            </p>
          ) : null}
          {movie.director ? (
            <p className="mt-1 text-[13px] text-fog">
              <span className="text-ash">Đạo diễn:</span> {movie.director}
            </p>
          ) : null}

          {movie.episodes[0]?.items?.length ? (
            <Link
              href={`/xem/${slug}?ep=${encodeURIComponent(movie.episodes[0].items[0].slug)}`}
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-acid-lime px-5 text-[14px] font-medium text-void transition-opacity hover:opacity-90"
            >
              ▶ Xem ngay
            </Link>
          ) : (
            <p className="mt-6 inline-flex h-10 items-center rounded-md border border-graphite px-5 text-[14px] text-ash">
              Chưa có tập nào
            </p>
          )}
        </div>
      </section>

      {/* Episodes by server */}
      {movie.episodes.some((s) => s.items.length > 0) ? (
        <section className="mt-12 space-y-8">
          {movie.episodes.map((server: EpisodeServer) =>
            server.items.length > 0 ? (
              <div key={server.server_name}>
                <h2 className="mb-3 font-mono text-[13px] uppercase tracking-wide text-ash">{server.server_name}</h2>
                <div className="flex flex-wrap gap-2">
                  {server.items.map((ep) => (
                    <Link
                      key={`${server.server_name}-${ep.slug}`}
                      href={`/xem/${slug}?sv=${encodeURIComponent(server.server_name)}&ep=${encodeURIComponent(ep.slug)}`}
                      className="inline-flex h-8 min-w-14 items-center justify-center rounded-md border border-graphite px-3 text-[13px] text-mist transition-colors hover:border-smoke hover:text-paper"
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
      <section className="mt-14">
        <h2 className="mb-4 text-[24px] font-medium tracking-tight text-paper">{relatedTitle}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {related.map((film) => (
            <FilmCard key={film.slug} film={film} />
          ))}
        </div>
      </section>
    </div>
  )
}
