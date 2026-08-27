import Link from 'next/link'
import UserMenu from '@/components/user-menu'
import MobileNav from '@/components/mobile-nav'
import SearchBox from '@/components/search-box'
import CategoryMenu from '@/components/category-menu'
import { currentUser } from '@/lib/auth'
import { GENRES, COUNTRIES, YEARS } from '@/lib/categories'

export default async function Navbar() {
  const user = await currentUser()

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-gradient-to-b from-void/95 via-void/60 to-transparent">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-8">
        <div className="flex items-center gap-5 sm:gap-7">
          <Link href="/" className="flex items-center gap-2 text-[18px] font-extrabold tracking-tight text-acid-lime sm:text-[20px]">
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
            <CategoryMenu label="Thể loại" options={GENRES} basePath="/the-loai" />
            <CategoryMenu label="Quốc gia" options={COUNTRIES} basePath="/quoc-gia" />
            <CategoryMenu label="Năm" options={YEARS} basePath="/nam-phat-hanh" />
            <Link href="/moi-cap-nhat" className="text-[14px] text-mist transition-colors hover:text-paper">
              Mới cập nhật
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Mobile: hamburger mở panel điều hướng (chỉ hiện < sm) */}
          <MobileNav />
          <SearchBox />
          {user && <UserMenu username={user} />}
        </div>
      </nav>
    </header>
  )
}
