import Link from 'next/link'
import Image from 'next/image'
import type { FilmListItem } from '@/lib/types'

function episodeLabel(current: string, total: number): string {
  if (!current || /^full$/i.test(current)) return 'Full'
  return current.length > 18 ? `Tập ${total}` : current
}

export default function FilmCard({ film }: { film: FilmListItem }) {
  const poster = film.poster_url || film.thumb_url
  return (
    <Link
      href={`/phim/${film.slug}`}
      className="group block overflow-hidden rounded-xl bg-carbon ring-1 ring-graphite transition-colors hover:ring-smoke"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-obsidian">
        <Image
          src={poster}
          alt={film.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute left-2 top-2 flex gap-1">
          {film.quality ? (
            <span className="rounded bg-void/80 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-acid-lime backdrop-blur-sm">
              {film.quality}
            </span>
          ) : null}
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void via-void/70 to-transparent px-2 pb-2 pt-8">
          <p className="truncate text-[13px] font-medium text-paper">{film.name}</p>
          <p className="mt-0.5 flex items-center justify-between text-[11px] text-fog">
            <span className="truncate">{episodeLabel(film.current_episode, film.total_episodes)}</span>
            <span>{film.year || ''}</span>
          </p>
        </div>
      </div>
      <div className="hidden p-2" aria-hidden>
        {film.original_name}
      </div>
    </Link>
  )
}
