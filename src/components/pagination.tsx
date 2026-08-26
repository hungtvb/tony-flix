import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Paginate } from '@/lib/types'

/** Quiet pill pagination, active page in acid-lime. */
export default function Pagination({
  paginate,
  basePath,
  query = {},
}: {
  paginate: Paginate
  basePath: string
  query?: Record<string, string>
}) {
  const page = paginate.current_page
  const total = Math.min(paginate.total_page, 200) // guard against 3k+ pages
  if (total <= 1) return null

  const windowStart = Math.max(1, Math.min(page - 2, total - 4))
  const windowEnd = Math.min(total, windowStart + 4)
  const pages: number[] = []
  for (let p = windowStart; p <= windowEnd; p += 1) pages.push(p)

  const hrefFor = (p: number) => {
    const params = new URLSearchParams({ ...query, page: String(p) })
    return `${basePath}?${params.toString()}`
  }

  const pill = 'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-[13px] transition-colors'

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={`${pill} border border-graphite text-mist hover:border-smoke hover:text-paper`} aria-label="Trang trước">
          <ChevronLeft size={15} strokeWidth={2} aria-hidden />
        </Link>
      ) : null}
      {windowStart > 1 ? (
        <>
          <Link href={hrefFor(1)} className={`${pill} text-fog hover:text-paper`}>
            1
          </Link>
          <span className="px-1 text-ash">…</span>
        </>
      ) : null}
      {pages.map((p) =>
        p === page ? (
          <span key={p} className={`${pill} bg-acid-lime font-medium text-void`}>
            {p}
          </span>
        ) : (
          <Link key={p} href={hrefFor(p)} className={`${pill} text-mist hover:bg-carbon hover:text-paper`}>
            {p}
          </Link>
        ),
      )}
      {windowEnd < total ? (
        <>
          <span className="px-1 text-ash">…</span>
          <Link href={hrefFor(total)} className={`${pill} text-fog hover:text-paper`}>
            {total}
          </Link>
        </>
      ) : null}
      {page < total ? (
        <Link href={hrefFor(page + 1)} className={`${pill} border border-graphite text-mist hover:border-smoke hover:text-paper`} aria-label="Trang sau">
          <ChevronRight size={15} strokeWidth={2} aria-hidden />
        </Link>
      ) : null}
    </nav>
  )
}
