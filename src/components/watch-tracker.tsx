'use client'

import { useEffect } from 'react'

/**
 * Ghi tiến độ xem khi user mở trang /xem/[slug].
 *
 * Gửi MỘT request POST /api/tien-do mỗi lần mount trang (đổi tập = đổi URL =
 * remount component vì đây là server page).
 *
 * Thông tin tập/server lấy từ URL (?sv=&ep=). Khi vào từ nút "Xem ngay"
 * (chỉ có ?ep= hoặc không có gì), dùng giá trị server đã resolve từ trang
 * (fallback props) để vẫn ghi đúng tiến độ.
 */
export default function WatchTracker({
  slug,
  fallbackServer,
  fallbackEpisode,
}: {
  slug: string
  fallbackServer?: string
  fallbackEpisode?: string
}) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ep = params.get('ep') ?? fallbackEpisode
    const sv = params.get('sv') ?? fallbackServer
    if (!ep || !sv) return

    fetch('/api/tien-do', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, episode: ep, serverName: sv }),
      keepalive: true,
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  return null
}
