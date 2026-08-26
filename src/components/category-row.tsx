'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import FilmCard from '@/components/film-card'
import type { FilmListItem } from '@/lib/types'

/**
 * Hàng phim theo danh mục, lazy-load qua /api/category khi user scroll tới.
 * Fail mềm: lỗi fetch → hàng biến mất, không ảnh hưởng trang.
 */
export default function CategoryRow({
  title,
  kind,
  slug,
  viewAllHref,
}: {
  title: string
  kind: 'the-loai' | 'quoc-gia' | 'nam-phat-hanh'
  slug: string
  viewAllHref?: string
}) {
  const [films, setFilms] = useState<FilmListItem[] | null>(null) // null = đang tải

  useEffect(() => {
    let alive = true
    fetch(`/api/category?kind=${kind}&slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        if (alive) setFilms(Array.isArray(d?.items) ? d.items.slice(0, 14) : [])
      })
      .catch(() => {
        if (alive) setFilms([])
      })
    return () => {
      alive = false
    }
  }, [kind, slug])

  if (films !== null && films.length === 0) return null

  return (
    <section className="mt-9">
      <div className="mb-3 flex items-baseline justify-between gap-3 px-4 sm:px-0">
        <h2 className="text-[20px] font-semibold tracking-tight text-paper">{title}</h2>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="inline-flex shrink-0 items-center gap-0.5 text-[13px] font-medium text-fog transition-colors hover:text-acid-lime"
          >
            Xem tất cả
            <ChevronRight size={15} strokeWidth={2} aria-hidden />
          </Link>
        ) : null}
      </div>

      <div className="no-scrollbar -mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-3 sm:px-0">
        {films === null
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-[132px] shrink-0 snap-start sm:w-[152px] md:w-[168px]">
                <div className="aspect-[2/3] w-full animate-pulse rounded-lg bg-carbon" />
              </div>
            ))
          : films.map((film) => (
              <div key={film.slug} className="w-[132px] shrink-0 snap-start sm:w-[152px] md:w-[168px]">
                <FilmCard film={film} />
              </div>
            ))}
      </div>
    </section>
  )
}
