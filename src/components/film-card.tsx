import Link from 'next/link'
import Image from 'next/image'
import type { FilmListItem } from '@/lib/types'

function episodeLabel(current: string, total: number): string {
  if (!current || /^full$/i.test(current)) return 'Full'
  return current.length > 18 ? `Tập ${total}` : current
}

export default function FilmCard({ film }: { film: FilmListItem }) {
  const poster = film.poster_url || film.thumb_url
  const isNew = (() => {
    const d = new Date(film.modified)
    return Number.isFinite(d.getTime()) && Date.now() - d.getTime() < 7 * 864e5
  })()

  return (
    <Link
      href={`/phim/${film.slug}`}
      className="group relative block rounded-lg outline-none transition-all duration-200 ease-out hover:z-10 hover:scale-[1.06] focus-visible:scale-[1.06]"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-obsidian shadow-lg shadow-black/50 ring-1 ring-white/5 transition-shadow group-hover:ring-white/25">
        <Image
          src={poster}
          alt={film.name}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 768px) 30vw, (max-width: 1024px) 24vw, 220px"
          className="object-cover"
        />

        {/* Hover veil + quick play */}
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="w-full p-2.5">
            <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-paper px-2.5 py-1 text-[11px] font-semibold text-void">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5.14v13.72L19 12 8 5.14z" />
              </svg>
              Xem ngay
            </span>
            <p className="line-clamp-2 text-[12px] font-medium leading-snug text-paper">
              {film.original_name && film.original_name !== film.name ? film.original_name : film.name}
            </p>
          </div>
        </div>

        {/* Top-right badges */}
        <div className="absolute right-1.5 top-1.5 flex flex-col items-end gap-1">
          {isNew ? (
            <span className="rounded-sm bg-acid-lime px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-paper">
              Mới
            </span>
          ) : null}
          {film.quality ? (
            <span className="rounded-sm bg-acid-lime/90 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-paper backdrop-blur-sm">
              {film.quality}
            </span>
          ) : null}
        </div>

        {/* Bottom info (always visible, darkened on hover) */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-2 pb-2 pt-6 transition-opacity group-hover:opacity-0">
          <p className="truncate text-[13px] font-medium text-bone">{film.name}</p>
          <p className="mt-0.5 flex items-center justify-between text-[11px] text-fog">
            <span className="truncate">{episodeLabel(film.current_episode, film.total_episodes)}</span>
            <span>{film.year || ''}</span>
          </p>
        </div>
      </div>
    </Link>
  )
}
