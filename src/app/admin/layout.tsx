import type { ReactNode } from 'react'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // requireAdmin ở server layout — tự redirect nếu không phải admin.
  // Chạy Node runtime (không phải Edge) nên đọc được DB an toàn.
  await requireAdmin()
  return (
    <div className="min-h-screen bg-void text-bone">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-60 shrink-0 border-r border-white/10 p-6 sm:block">
          <Link href="/admin" className="mb-8 block text-lg font-extrabold text-acid-lime">
            TONYFLIX ADMIN
          </Link>
          <nav className="flex flex-col gap-1 text-sm">
            <AdminNavLink href="/admin" label="Dashboard" />
            <AdminNavLink href="/admin/users" label="Người dùng" />
            <AdminNavLink href="/admin/content" label="Nội dung" />
            <AdminNavLink href="/admin/settings" label="Cài đặt" />
            <Link href="/" className="mt-6 text-mist/70 transition-colors hover:text-acid-lime">
              ← Về trang chủ
            </Link>
          </nav>
        </aside>
        <main className="flex-1 p-6 sm:p-10">{children}</main>
      </div>
    </div>
  )
}

function AdminNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-2 text-mist transition-colors hover:bg-white/5 hover:text-acid-lime"
    >
      {label}
    </Link>
  )
}
