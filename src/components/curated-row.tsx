import Link from 'next/link'
import FilmCard from '@/components/film-card'
import { Star } from 'lucide-react'
import { listCuratedFilms } from '@/lib/db'
import type { FilmListItem } from '@/lib/types'

const CARD_W = 'w-[104px] shrink-0 snap-start sm:w-[152px] md:w-[168px]'

/**
 * Hàng "Editor's picks" trên trang chủ — server-rendered trực tiếp từ bảng
 * curated_films (DB). Mỗi item đã được enrich title + poster khi admin thêm,
 * nên không cần gọi NguonC ở đây. Rỗng → trả null (không làm hỏng layout).
 */
export default async function CuratedRow() {
  let films: { filmSlug: string; title: string; poster: string; note: string }[] = []
  try {
    films = await listCuratedFilms()
  } catch {
    films = []
  }
  if (films.length === 0) return null

  // Map sang shape FilmCard hiểu (chỉ cần name + slug + thumb_url).
  const items: FilmListItem[] = films.map((f) => ({
    name: f.title,
    slug: f.filmSlug,
    original_name: '',
    thumb_url: f.poster,
    poster_url: f.poster,
    created: '',
    modified: '',
    description: f.note,
    total_episodes: 0,
    current_episode: '',
    time: '',
    quality: '',
    language: '',
    director: null,
    casts: '',
    year: 0,
  }))

  return (
    <section className="mt-7 sm:mt-9">
      <div className="mb-2.5 flex items-center gap-2 px-4 sm:mb-3 sm:px-0">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-acid-lime/20 text-acid-lime">
          <Star size={14} strokeWidth={2.5} fill="currentColor" aria-hidden />
        </span>
        <h2 className="text-[17px] font-semibold tracking-tight text-paper sm:text-[20px]">
          Editor&apos;s picks
        </h2>
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-3 sm:px-0">
        {items.map((film) => (
          <div key={film.slug} className={CARD_W}>
            <FilmCard film={film} />
          </div>
        ))}
      </div>
    </section>
  )
}
