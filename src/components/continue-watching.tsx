'use client'

import { useEffect, useState } from 'react'
import { Play } from 'lucide-react'

/**
 * Hàng "Tiếp tục xem" trên trang chủ — client component vì dữ liệu theo từng
 * user (trang chủ dùng ISR cache chung cho mọi người, không thể render theo user).
 * Ẩn hoàn toàn khi chưa có tiến độ hoặc lỗi.
 */

interface ProgressItem {
  slug: string
  name: string
  posterUrl: string
  episode: string
  serverName: string
}

/** 'tap-5' → 'Tập 5'; 'full-…' → 'Full'; còn lại hiển thị nguyên bản. */
function episodeLabel(slug: string): string {
  const m = /^tap-(\d+)$/.exec(slug)
  if (m) return `Tập ${m[1]}`
  if (/^full/i.test(slug)) return 'Full'
  return slug
}

export default function ContinueWatching() {
  const [items, setItems] = useState<ProgressItem[] | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/api/tien-do')
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data: { items?: ProgressItem[] }) => {
        if (alive) setItems(data.items ?? [])
      })
      .catch(() => {
        if (alive) setItems([])
      })
    return () => {
      alive = false
    }
  }, [])

  if (!items || items.length === 0) return null

  return (
    <section className="mt-7 sm:mt-9">
      <h2 className="mb-2.5 px-4 text-[17px] font-semibold tracking-tight text-paper sm:mb-3 sm:px-0 sm:text-[20px]">
        Tiếp tục xem
      </h2>
      <div className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-3 sm:px-0">
        {items.map((item) => (
          <a
            key={item.slug}
            href={`/xem/${item.slug}?sv=${encodeURIComponent(item.serverName)}&ep=${encodeURIComponent(item.episode)}`}
            className="group relative block w-[168px] shrink-0 snap-start overflow-hidden rounded-lg bg-carbon shadow-lg shadow-black/40 ring-1 ring-white/5 transition-transform duration-200 hover:z-10 hover:scale-[1.04] sm:w-[220px]"
          >
            <div className="relative aspect-video w-full">
              {item.posterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.posterUrl} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-obsidian">
                  <Play size={22} className="text-ash" aria-hidden />
                </div>
              )}
              <span className="absolute right-1.5 top-1.5 rounded-sm bg-acid-lime px-1.5 py-0.5 text-[10px] font-bold text-void">
                {episodeLabel(item.episode)}
              </span>
            </div>
            <p className="line-clamp-1 px-2.5 py-2 text-[12px] font-medium leading-snug text-paper sm:text-[13px]">
              {item.name}
            </p>
          </a>
        ))}
      </div>
    </section>
  )
}
