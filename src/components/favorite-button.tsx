'use client'

import { useEffect, useState, useTransition } from 'react'
import { Heart } from 'lucide-react'

/**
 * Nút yêu thích ở trang chi tiết phim.
 *
 * Trang chi tiết dùng ISR cache (revalidate=60) nên trạng thái tim KHÔNG thể
 * render server-side theo user (sẽ leak giữa các user). Component client fetch
 * /api/yeu-thich?slug=… một lần khi mount rồi toggle optimistic.
 */

export default function FavoriteButton({ slug }: { slug: string }) {
  const [favorited, setFavorited] = useState(false)
  const [checked, setChecked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [, startTransition] = useTransition()

  useEffect(() => {
    let alive = true
    fetch('/api/yeu-thich?slug=' + encodeURIComponent(slug))
      .then((r) => (r.ok ? r.json() : { favorited: false }))
      .then((data: { favorited?: boolean }) => {
        if (alive) startTransition(() => setFavorited(Boolean(data.favorited)))
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setChecked(true)
      })
    return () => {
      alive = false
    }
  }, [slug])

  async function toggle() {
    if (busy || !checked) return
    setBusy(true)
    const next = !favorited
    setFavorited(next) // optimistic
    try {
      const res = await fetch('/api/yeu-thich', {
        method: next ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })
      if (!res.ok) setFavorited(!next) // rollback khi lỗi
    } catch {
      setFavorited(!next)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={favorited}
      aria-label={favorited ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-md border transition-colors sm:h-11 sm:w-11 ${
        favorited
          ? 'border-acid-lime/60 bg-acid-lime/15 text-acid-lime'
          : 'border-white/25 text-paper hover:border-white/50 hover:bg-white/5'
      } ${busy ? 'opacity-70' : ''}`}
    >
      <Heart size={18} strokeWidth={2.25} fill={favorited ? 'currentColor' : 'none'} aria-hidden />
    </button>
  )
}
