'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Play } from 'lucide-react'

interface ProgressItem {
  slug: string
  name: string
  posterUrl: string
  episode: string
  serverName: string
}

function episodeLabel(slug: string): string {
  const m = /^tap-(\d+)$/.exec(slug)
  if (m) return `Tập ${m[1]}`
  if (/full/i.test(slug)) return 'Full'
  return slug.replace(/^tap-/, '')
}

export default function WatchHistory() {
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

  if (items === null) {
    return <p className="px-4 py-10 text-center text-sm text-mist sm:px-0">Đang tải lịch sử…</p>
  }
  if (items.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-mist sm:px-0">
        Chưa có phim nào trong lịch sử xem.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:gap-4 sm:px-0 md:grid-cols-5 lg:grid-cols-6">
      {items.map((item) => (
        <Link
          key={item.slug}
          href={`/xem/${item.slug}?ep=${encodeURIComponent(item.episode)}`}
          className="group relative block overflow-hidden rounded-lg bg-carbon ring-1 ring-white/5 transition-transform duration-200 hover:scale-[1.03]"
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
        </Link>
      ))}
    </div>
  )
}
