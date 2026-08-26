import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ChevronRight, Info } from 'lucide-react'
import PlayerFrame from '@/components/player-frame'
import FilmCard from '@/components/film-card'
import { fetchFilm, searchFilms } from '@/lib/nguonc'
import type { EpisodeServer, FilmListItem } from '@/lib/types'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  try {
    const data = await fetchFilm(slug)
    return { title: `Xem ${data.movie.name}` }
  } catch {
    return { title: 'Xem phim' }
  }
}

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sv?: string; ep?: string }>
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  let movie
  try {
    const data = await fetchFilm(slug)
    movie = data.movie
  } catch {
    notFound()
  }

  const servers: EpisodeServer[] = movie.episodes.filter((s) => s.items.length > 0)
  const activeServer = servers.find((s) => s.server_name === query.sv) ?? servers[0]
  const activeEp = activeServer?.items.find((e) => e.slug === query.ep) ?? activeServer?.items[0]

  if (!activeEp || !activeServer) notFound()

  const epIndex = activeServer.items.findIndex((e) => e.slug === activeEp.slug)
  const prev = epIndex > 0 ? activeServer.items[epIndex - 1] : undefined
  const next = epIndex < activeServer.items.length - 1 ? activeServer.items[epIndex + 1] : undefined

  const watchHref = (epSlug?: string, svName?: string) =>
    `/xem/${slug}?${new URLSearchParams({ ...(svName ? { sv: svName } : {}), ...(epSlug ? { ep: epSlug } : {}) }).toString()}`

  return (
    <div className="-mx-4 sm:-mx-8">
      {/* Player — edge to edge like Netflix */}
      <div className="relative bg-black">
        <PlayerFrame src={activeEp.embed} title={`${movie.name} — ${activeEp.name}`} />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-8">
        {/* Title + episode nav */}
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight text-paper">{movie.name}</h1>
            <p className="mt-1 text-[13px] text-fog">
              {activeServer.server_name} · {activeEp.name}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href={`/phim/${slug}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-white/10 px-3.5 text-[13px] font-medium text-paper transition-colors hover:bg-white/20"
            >
              <Info size={14} strokeWidth={2} aria-hidden />
              Thông tin
            </Link>
            {prev ? (
              <Link
                href={watchHref(prev.slug, activeServer.server_name)}
                className="inline-flex h-9 items-center gap-1 rounded-md border border-graphite px-3.5 text-[13px] text-mist transition-colors hover:border-smoke hover:text-paper"
              >
                <ChevronLeft size={15} strokeWidth={2} aria-hidden />
                Tập trước
              </Link>
            ) : null}
            {next ? (
              <Link
                href={watchHref(next.slug, activeServer.server_name)}
                className="inline-flex h-9 items-center gap-1 rounded-md bg-acid-lime px-4 text-[13px] font-semibold text-void transition-opacity hover:opacity-90"
              >
                Tập sau
                <ChevronRight size={15} strokeWidth={2} aria-hidden />
              </Link>
            ) : null}
          </div>
        </div>

        {/* Episodes */}
        <section className="mt-7">
          {servers.length > 1 ? (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[12px] uppercase tracking-wide text-ash">Máy chủ</span>
              {servers.map((server) => (
                <Link
                  key={server.server_name}
                  href={watchHref(server.items[0]?.slug, server.server_name)}
                  className={`inline-flex h-8 items-center rounded-md px-3 text-[13px] transition-colors ${
                    server.server_name === activeServer.server_name
                      ? 'bg-acid-lime font-semibold text-void'
                      : 'bg-white/5 text-mist hover:bg-white/15 hover:text-paper'
                  }`}
                >
                  {server.server_name}
                </Link>
              ))}
            </div>
          ) : null}
          <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1">
            {activeServer.items.map((ep) =>
              ep.slug === activeEp.slug ? (
                <span
                  key={ep.slug}
                  className="inline-flex h-9 min-w-14 items-center justify-center rounded-md bg-acid-lime px-3 text-[13px] font-semibold text-void"
                >
                  {ep.name}
                </span>
              ) : (
                <Link
                  key={ep.slug}
                  href={watchHref(ep.slug, activeServer.server_name)}
                  className="inline-flex h-9 min-w-14 items-center justify-center rounded bg-white/5 px-3 text-[13px] text-mist transition-colors hover:bg-white/20 hover:text-paper"
                >
                  {ep.name}
                </Link>
              ),
            )}
          </div>
        </section>

        {/* Related */}
        <RelatedRow slug={slug} currentName={movie.name} />
      </div>
    </div>
  )
}

/** Server component fetching related films; kept separate to isolate failures. */
async function RelatedRow({ slug, currentName }: { slug: string; currentName: string }) {
  let related: FilmListItem[] = []
  try {
    const guess = currentName.split(/[:\-–]/)[0].trim()
    const res = await searchFilms(guess, 1)
    related = res.items.filter((f) => f.slug !== slug).slice(0, 12)
  } catch {
    related = []
  }

  if (related.length === 0) return null
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-[20px] font-semibold tracking-tight text-paper">Có thể bạn cũng thích</h2>
      <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-2 sm:-mx-8 sm:gap-3 sm:px-8">
        {related.map((film) => (
          <div key={film.slug} className="w-[132px] shrink-0 sm:w-[152px] md:w-[168px]">
            <FilmCard film={film} />
          </div>
        ))}
      </div>
    </section>
  )
}
