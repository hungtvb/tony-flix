'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import FilmCard from '@/components/film-card'
import type { FilmListItem } from '@/lib/types'

/**
 * Hàng phim theo danh mục, lazy-load qua /api/category khi user scroll tới.
 * Fail mềm: lỗi fetch → hàng biến mất, không ảnh hưởng trang.
 * Desktop: có nút prev/next cuộn ngang (ẩn trên mobile — vuốt tay).
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
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  useEffect(() => {
    let alive = true
    fetch(`/api/category?kind=${kind}&slug=${encodeURIComponent(slug)}`, {
      credentials: 'same-origin',
    })
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

  function updateArrows() {
    const el = scrollerRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 8)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }

  useEffect(() => {
    updateArrows()
    const el = scrollerRef.current
    if (!el) return
    el.addEventListener('scroll', updateArrows, { passive: true })
    window.addEventListener('resize', updateArrows)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      el.removeEventListener('resize', updateArrows)
    }
  }, [films])

  function scrollBy(dir: 1 | -1) {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  if (films !== null && films.length === 0) return null

  return (
    <section className="mt-9">
      <div className="mb-3 flex items-center justify-between gap-3 px-4 sm:px-0">
        <h2 className="text-[17px] font-semibold tracking-tight text-paper sm:text-[20px]">{title}</h2>
        <div className="flex items-center gap-2">
          {viewAllHref ? (
            <Link
              href={viewAllHref}
              className="hidden items-center gap-0.5 text-[13px] font-medium text-fog transition-colors hover:text-acid-lime sm:inline-flex"
            >
              Xem tất cả
              <ChevronRight size={15} strokeWidth={2} aria-hidden />
            </Link>
          ) : null}
          {/* Desktop scroll arrows */}
          <div className="hidden items-center gap-1.5 sm:flex">
            <button
              type="button"
              aria-label="Cuộn sang trái"
              onClick={() => scrollBy(-1)}
              disabled={!canLeft}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-graphite bg-carbon/80 text-paper backdrop-blur-sm transition-colors hover:border-acid-lime/50 hover:text-acid-lime disabled:cursor-default disabled:opacity-30"
            >
              <ChevronLeft size={15} strokeWidth={2.5} aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Cuộn sang phải"
              onClick={() => scrollBy(1)}
              disabled={!canRight}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-graphite bg-carbon/80 text-paper backdrop-blur-sm transition-colors hover:border-acid-lime/50 hover:text-acid-lime disabled:cursor-default disabled:opacity-30"
            >
              <ChevronRight size={15} strokeWidth={2.5} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-3 sm:px-0"
      >
        {films === null
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-[104px] shrink-0 snap-start sm:w-[152px] md:w-[168px]">
                <div className="aspect-[2/3] w-full animate-pulse rounded-lg bg-carbon" />
              </div>
            ))
          : films.map((film) => (
              <div key={film.slug} className="w-[104px] shrink-0 snap-start sm:w-[152px] md:w-[168px]">
                <FilmCard film={film} />
              </div>
            ))}
      </div>
    </section>
  )
}
