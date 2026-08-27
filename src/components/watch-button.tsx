'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Play } from 'lucide-react'

/**
 * Nút "Xem ngay" thông minh:
 * - Phim lẻ (1 tập 'full'): link thẳng /xem/[slug]?ep=full
 * - Phim bộ: fetch /api/tien-do, nếu user đang xem dở phim này → vào tập dở,
 *   ngược lại vào tập đầu. Fail mềm (không có progress) → tập đầu.
 */
export default function WatchButton({
  slug,
  firstEpisodeSlug,
  isSingle,
}: {
  slug: string
  firstEpisodeSlug: string
  isSingle: boolean
}) {
  const [ep, setEp] = useState<string>(isSingle ? 'full' : firstEpisodeSlug)
  const [label, setLabel] = useState<string>('Xem ngay')

  useEffect(() => {
    if (isSingle) {
      setEp('full')
      return
    }
    let alive = true
    fetch('/api/tien-do', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data: { items?: { slug: string; episode: string }[] }) => {
        if (!alive) return
        const found = (data.items ?? []).find((i) => i.slug === slug)
        if (found?.episode) {
          setEp(found.episode)
          const m = /^tap-(\d+)$/.exec(found.episode)
          setLabel(m ? `Tiếp tập ${m[1]}` : 'Xem tiếp')
        }
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [slug, isSingle, firstEpisodeSlug])

  return (
    <Link
      href={`/xem/${slug}?ep=${encodeURIComponent(ep)}`}
      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-acid-lime px-7 text-[14px] font-semibold text-void transition-opacity hover:opacity-90 sm:h-11 sm:flex-none sm:text-[15px]"
    >
      <Play size={16} strokeWidth={2.5} fill="currentColor" aria-hidden />
      {label}
    </Link>
  )
}
