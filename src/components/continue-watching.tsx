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

/** 'tap-5' → 'Tập 5'; '*full*' → 'Full'; còn lại bỏ tiền tố tap-. */
function episodeLabel(slug: string): string {
  const m = /^tap-(\d+)$/.exec(slug)
  if (m) return `Tập ${m[1]}`
  if (/full/i.test(slug)) return 'Full'
  return slug.replace(/^tap-/, '')
}

export default function ContinueWatching() {
  const [items, setItems] = useState<ProgressItem[] | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/api/tien-do', { credentials: 'same-origin' })
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
            className="group relative block rounded-lg outline-none transition-transform duration-200 ease-out hover:z-10 hover:scale-[1.06] focus-visible:scale-[1.06] w-[168px] shrink-0 snap-start sm:w-[220px]"
          >
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-obsidian shadow-lg shadow-black/50 ring-1 ring-white/5 transition-shadow group-hover:ring-acid-lime/50">
              {item.posterUrl ? (
                <img src={item.posterUrl} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-obsidian">
                  <Play size={22} className="text-ash" aria-hidden />
                </div>
              )}

              {/* Hover veil + quick play (desktop only — mobile has no hover) */}
              <div className="absolute inset-0 hidden items-end bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:flex">
                <div className="w-full p-2.5">
                  <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-md bg-acid-lime px-2.5 py-1 text-[11px] font-semibold text-void">
                    <Play size={10} strokeWidth={2.5} fill="currentColor" aria-hidden />
                    Xem ngay
                  </span>
                  <p className="line-clamp-2 text-[12px] font-medium leading-snug text-paper">
                    {item.name}
                  </p>
                </div>
              </div>

              {/* Top-right episode badge */}
              <div className="absolute right-1.5 top-1.5 flex flex-col items-end gap-1">
                <span className="rounded-sm bg-acid-lime px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-void sm:text-[10px]">
                  {episodeLabel(item.episode)}
                </span>
              </div>

              {/* Bottom info (always visible, darkened on hover) */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/75 to-transparent px-2 pb-1.5 pt-7 transition-opacity group-hover:opacity-0 sm:pb-2">
                <p className="line-clamp-2 min-h-[2.4em] text-[11px] font-semibold leading-snug text-bone sm:text-[13px]">{item.name}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
