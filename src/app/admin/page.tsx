import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'

export default async function AdminDashboard() {
  const admin = await requireAdmin()
  return (
    <div>
      <h1 className="text-2xl font-bold text-paper">Dashboard</h1>
      <p className="mt-2 text-mist">
        Xin chào <span className="font-semibold text-acid-lime">{admin.username}</span>. Chọn mục bên trái để quản lý.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminCard href="/admin/users" title="Người dùng" desc="Danh sách, reset & xoá tài khoản." />
        <AdminCard href="/admin/content" title="Nội dung" desc="Chọn phim nổi bật hiển thị trang chủ." />
        <AdminCard href="/admin/settings" title="Cài đặt" desc="Tên web, banner, chế độ bảo trì." />
      </div>
    </div>
  )
}

function AdminCard({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-acid-lime/50"
    >
      <div className="text-lg font-semibold text-paper">{title}</div>
      <div className="mt-1 text-sm text-mist">{desc}</div>
    </Link>
  )
}
