import Link from 'next/link'

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-gradient-to-b from-black/85 via-black/50 to-transparent transition-colors">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center text-[22px] font-extrabold tracking-tight text-acid-lime">
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

        <form action="/tim-kiem" className="flex items-center">
          <input
            type="search"
            name="keyword"
            placeholder="Tìm phim…"
            autoComplete="off"
            className="h-9 w-36 rounded border border-white/25 bg-black/60 px-3 text-[13px] text-paper outline-none backdrop-blur-sm transition-all placeholder:text-ash focus:w-52 focus:border-white/60 focus:bg-black/80 sm:w-44"
          />
        </form>
      </nav>
    </header>
  )
}
