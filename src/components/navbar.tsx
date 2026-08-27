import Link from 'next/link'
import { Heart } from 'lucide-react'
import UserMenu from '@/components/user-menu'
import MobileNav from '@/components/mobile-nav'
import SearchBox from '@/components/search-box'
import { currentUser } from '@/lib/auth'

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
            <Link href="/moi-cap-nhat" className="text-[14px] text-mist transition-colors hover:text-paper">
              Mới cập nhật
            </Link>
            <Link href="/yeu-thich" className="text-[14px] text-mist transition-colors hover:text-paper">
              Yêu thích
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Mobile: hamburger mở panel điều hướng (chỉ hiện < sm) */}
          <MobileNav />
          {/* Mobile-only: link Yêu thích dạng icon (menu text chỉ hiện từ sm trở lên) */}
          <Link href="/yeu-thich" aria-label="Yêu thích" className="flex h-8 w-8 items-center justify-center rounded-md text-paper transition-colors hover:bg-white/10 sm:hidden">
            <Heart size={17} strokeWidth={2} aria-hidden />
          </Link>
          <SearchBox />
          {user && <UserMenu username={user} />}
        </div>
      </nav>
    </header>
  )
}
