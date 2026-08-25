import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchFilm } from '@/lib/nguonc'
import type { EpisodeServer } from '@/lib/types'

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

  // Resolve active server + episode (default: first of first non-empty server)
  const servers: EpisodeServer[] = movie.episodes.filter((s) => s.items.length > 0)
  const activeServer =
    servers.find((s) => s.server_name === query.sv) ?? servers[0]
  const activeEp =
    activeServer?.items.find((e) => e.slug === query.ep) ?? activeServer?.items[0]

  if (!activeEp) notFound()

  // Flat episode navigation across the active server
  const epIndex = activeServer.items.findIndex((e) => e.slug === activeEp.slug)
  const prev = epIndex > 0 ? activeServer.items[epIndex - 1] : undefined
  const next = epIndex < activeServer.items.length - 1 ? activeServer.items[epIndex + 1] : undefined

  const watchHref = (epSlug?: string, svName?: string) =>
    `/xem/${slug}?${new URLSearchParams({ ...(svName ? { sv: svName } : {}), ...(epSlug ? { ep: epSlug } : {}) }).toString()}`

  return (
    <div className="pt-6">
      {/* Player */}
      <div className="overflow-hidden rounded-xl bg-carbon ring-1 ring-graphite">
        <div className="relative aspect-video w-full bg-void">
          <iframe
            src={activeEp.embed}
            title={`${movie.name} — ${activeEp.name}`}
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            referrerPolicy="origin"
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      </div>

      {/* Title + episode nav */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-medium tracking-tight text-paper">{movie.name}</h1>
          <p className="mt-0.5 font-mono text-[12px] text-ash">
            {activeServer?.server_name} · tập {activeEp.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {prev ? (
            <Link
              href={watchHref(prev.slug, activeServer.server_name)}
              className="inline-flex h-8 items-center rounded-md border border-graphite px-3 text-[13px] text-mist hover:border-smoke hover:text-paper"
            >
              ← Tập trước
            </Link>
          ) : null}
          {next ? (
            <Link
              href={watchHref(next.slug, activeServer.server_name)}
              className="inline-flex h-8 items-center rounded-md bg-acid-lime px-3 text-[13px] font-medium text-void hover:opacity-90"
            >
              Tập sau →
            </Link>
          ) : null}
        </div>
      </div>

      {/* Server tabs */}
      <section className="mt-8 space-y-6">
        <div>
          <h2 className="mb-3 font-mono text-[13px] uppercase tracking-wide text-ash">Danh sách tập</h2>
          <div className="mb-4 flex flex-wrap gap-2">
            {servers.map((server) => (
              <Link
                key={server.server_name}
                href={watchHref(server.items[0]?.slug, server.server_name)}
                className={`inline-flex h-7 items-center rounded-full px-3 text-[12px] transition-colors ${
                  server.server_name === activeServer?.server_name
                    ? 'bg-white/10 text-paper'
                    : 'text-fog hover:bg-white/5 hover:text-mist'
                }`}
              >
                {server.server_name}
              </Link>
            ))}
          </div>
          <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto pr-1">
            {activeServer?.items.map((ep) =>
              ep.slug === activeEp.slug ? (
                <span key={ep.slug} className="inline-flex h-8 min-w-14 items-center justify-center rounded-md bg-acid-lime px-3 text-[13px] font-medium text-void">
                  {ep.name}
                </span>
              ) : (
                <Link
                  key={ep.slug}
                  href={watchHref(ep.slug, activeServer.server_name)}
                  className="inline-flex h-8 min-w-14 items-center justify-center rounded-md border border-graphite px-3 text-[13px] text-mist hover:border-smoke hover:text-paper"
                >
                  {ep.name}
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      <p className="mt-8 text-[13px] text-ash">
        Player là embed từ nguồn phát bên thứ ba. Nếu video không chạy, thử đổi server khác ở trên.
      </p>

      {/* Back to detail */}
      <p className="mt-2">
        <Link href={`/phim/${slug}`} className="text-[13px] text-mist underline-offset-4 hover:text-paper hover:underline">
          ← Về trang phim
        </Link>
      </p>
    </div>
  )
}
