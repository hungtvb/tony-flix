/**
 * Cache-Control headers cho API proxy NguonC.
 * - s-maxage: Railway edge / CDN cache (shared) — giảm calls tới upstream
 * - stale-while-revalidate: phục vụ bản cũ trong lúc background refresh
 * Giữ max-age=0 cho browser để luôn hỏi edge (tránh cache riêng lẻ lỗi thời).
 */
export function proxyCacheHeaders(seconds = 300): HeadersInit {
  return {
    'Cache-Control': `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`,
  }
}
