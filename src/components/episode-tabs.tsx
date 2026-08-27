'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { EpisodeServer } from '@/lib/types'

/**
 * Chọn tập theo server dưới dạng tabs ngang (thay vì xếp dọc từng block).
 * Phim lẻ (1 server, 1 tập FULL) sẽ gọn gàng thay vì 2 khối thưa.
 */
export default function EpisodeTabs({
  slug,
  servers,
}: {
  slug: string
  servers: EpisodeServer[]
}) {
  const [active, setActive] = useState(0)
  const current = servers[active]
  if (!current) return null

  return (
    <div>
      {/* Tab headers */}
      <div className="flex flex-wrap gap-2">
        {servers.map((s, i) => (
          <button
            key={s.server_name}
            type="button"
            onClick={() => setActive(i)}
            className={`inline-flex h-9 items-center rounded-md px-3 text-[13px] font-medium transition-colors ${
              i === active
                ? 'bg-acid-lime text-void'
                : 'border border-white/20 text-mist hover:border-white/40 hover:text-paper'
            }`}
          >
            {s.server_name}
            <span className={`ml-1.5 text-[11px] ${i === active ? 'text-void/70' : 'text-ash'}`}>
              {s.items.length}
            </span>
          </button>
        ))}
      </div>

      {/* Episode grid */}
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-2.5">
        {current.items.map((ep) => (
          <Link
            key={ep.slug}
            href={`/xem/${slug}?sv=${encodeURIComponent(current.server_name)}&ep=${encodeURIComponent(ep.slug)}`}
            className="inline-flex h-9 min-w-0 items-center justify-center overflow-hidden rounded-md bg-white/5 px-2 text-[13px] text-mist transition-colors hover:bg-acid-lime hover:text-void"
          >
            <span className="truncate">{ep.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
