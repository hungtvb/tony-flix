'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'

interface FavItem {
  slug: string
  name: string
  posterUrl: string
}

export default function PublicFavorites({ user }: { user: string }) {
  const [items, setItems] = useState<FavItem[] | null>(null)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    let alive = true
    fetch(`/api/yeu-thich/${encodeURIComponent(user)}`, { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { items: [], total: 0 }))
      .then((data: { items?: FavItem[]; total?: number }) => {
        if (!alive) return
        setItems(data.items ?? [])
        setTotal(data.total ?? 0)
      })
      .catch(() => {
        if (alive) setItems([])
      })
    return () => {
      alive = false
    }
  }, [user])

  if (items === null) {
    return <p className="px-4 py-10 text-center text-sm text-mist sm:px-0">Đang tải…</p>
  }
  if (items.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-mist sm:px-0">
        @{user} chưa có phim yêu thích nào.
      </p>
    )
  }

  return (
    <>
      <p className="mb-5 px-4 text-[13px] text-mist sm:px-0 sm:text-[14px]">
        {total} phim trong danh sách của @{user}
      </p>
      <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:gap-4 sm:px-0 md:grid-cols-5 lg:grid-cols-6">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/phim/${item.slug}`}
            className="group relative block overflow-hidden rounded-lg bg-carbon ring-1 ring-white/5 transition-transform duration-200 hover:scale-[1.03]"
          >
            <div className="relative aspect-[2/3] w-full">
              {item.posterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.posterUrl} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-obsidian">
                  <Heart size={22} className="text-ash" aria-hidden />
                </div>
              )}
            </div>
            <p className="line-clamp-2 px-2.5 py-2 text-[12px] font-medium leading-snug text-paper sm:text-[13px]">
              {item.name}
            </p>
          </Link>
        ))}
      </div>
    </>
  )
}
