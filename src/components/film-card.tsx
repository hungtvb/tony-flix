import Link from 'next/link'
import Image from 'next/image'
import { Play } from 'lucide-react'
import type { FilmListItem } from '@/lib/types'

function episodeLabel(current: string, total: number): string {
  if (!current || /^full$/i.test(current)) return 'Full'
  return current.length > 18 ? `Tập ${total}` : current
}

export default function FilmCard({ film }: { film: FilmListItem }) {
  // NguonC: poster_url = ảnh NGANG, thumb_url = ảnh DỌC → card 2:3 cần thumb
  const poster = film.thumb_url || film.poster_url
  const isNew = (() => {
    const d = new Date(film.modified)
    return Number.isFinite(d.getTime()) && Date.now() - d.getTime() < 7 * 864e5
  })()

  return (
    <Link
      href={`/phim/${film.slug}`}
      className="group relative block rounded-lg outline-none transition-transform duration-200 ease-out hover:z-10 sm:hover:scale-[1.06] focus-visible:scale-[1.06]"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-obsidian shadow-lg shadow-black/50 ring-1 ring-white/5 transition-shadow group-hover:ring-acid-lime/50">
        <Image
          src={poster}
          alt={film.name}
          fill
          sizes="(max-width: 640px) 33vw, (max-width: 768px) 30vw, (max-width: 1024px) 24vw, 220px"
          className="object-cover"
        />

        {/* Hover veil + quick play (desktop only — mobile has no hover) */}
        <div className="absolute inset-0 hidden items-end bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:flex">
          <div className="w-full p-2.5">
            <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-md bg-acid-lime px-2.5 py-1 text-[11px] font-semibold text-void">
              <Play size={10} strokeWidth={2.5} fill="currentColor" aria-hidden />
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
            <span className="rounded-sm bg-acid-lime px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-void sm:text-[10px]">
              Mới
            </span>
          ) : null}
          {film.quality ? (
            <span className="rounded-sm bg-void/85 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-acid-lime backdrop-blur-sm sm:text-[10px]">
              {film.quality}
            </span>
          ) : null}
        </div>

        {/* Bottom info (always visible, darkened on hover) */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-2 pb-1.5 pt-6 transition-opacity group-hover:opacity-0 sm:pb-2">
          <p className="truncate text-[11px] font-medium text-bone sm:text-[13px]">{film.name}</p>
          <p className="mt-0.5 flex items-center justify-between text-[10px] text-fog sm:text-[11px]">
            <span className="truncate">{episodeLabel(film.current_episode, film.total_episodes)}</span>
            <span>{film.year || ''}</span>
          </p>
        </div>
      </div>
    </Link>
  )
}
