import Link from 'next/link'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-graphite/60 bg-void/85 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-[15px] font-medium tracking-tight text-paper">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-acid-lime text-void">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5.14v13.72L19 12 8 5.14z" />
              </svg>
            </span>
            TonyFlix
          </Link>
          <div className="hidden items-center gap-1 sm:flex">
            <Link href="/" className="rounded-md px-3 py-1.5 text-[13px] text-mist transition-colors hover:text-paper">
              Trang chủ
            </Link>
            <a
              href="/#moi-cap-nhat"
              className="rounded-md px-3 py-1.5 text-[13px] text-mist transition-colors hover:text-paper"
            >
              Mới cập nhật
            </a>
          </div>
        </div>

        <form action="/tim-kiem" className="flex items-center gap-2">
          <input
            type="search"
            name="keyword"
            placeholder="Tìm phim…"
            autoComplete="off"
            className="h-8 w-36 rounded-md border border-smoke/60 bg-carbon px-3 text-[13px] text-mist outline-none transition-colors placeholder:text-ash focus:border-mist sm:w-52"
          />
        </form>
      </nav>
    </header>
  )
}
