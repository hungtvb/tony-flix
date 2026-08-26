import Link from 'next/link'
import { Search } from 'lucide-react'

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-gradient-to-b from-void/95 via-void/60 to-transparent">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-2 text-[20px] font-extrabold tracking-tight text-acid-lime">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-acid-lime text-void">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5.14v13.72L19 12 8 5.14z" />
              </svg>
            </span>
            TONYFLIX
          </Link>
          <div className="hidden items-center gap-4 sm:flex">
            <Link href="/" className="text-[14px] text-bone transition-colors hover:text-fog">
              Trang chủ
            </Link>
            <Link href="/moi-cap-nhat" className="text-[14px] text-mist transition-colors hover:text-paper">
              Mới cập nhật
            </Link>
          </div>
        </div>

        <form action="/tim-kiem" className="flex items-center gap-2">
          <div className="relative flex items-center">
            <Search size={15} strokeWidth={2} className="pointer-events-none absolute left-3 text-ash" aria-hidden />
            <input
              type="search"
              name="keyword"
              placeholder="Tìm phim…"
              autoComplete="off"
              className="h-9 w-40 rounded-md border border-graphite bg-carbon/90 pl-9 pr-3 text-[13px] text-paper outline-none backdrop-blur-sm transition-all placeholder:text-ash focus:w-56 focus:border-smoke sm:w-48"
            />
          </div>
        </form>
      </nav>
    </header>
  )
}
