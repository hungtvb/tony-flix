import { requireAdmin } from '@/lib/admin'
import UsersTable from '@/components/admin-users-table'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  await requireAdmin()
  return (
    <div>
      <h1 className="text-2xl font-bold text-paper">Người dùng</h1>
      <p className="mt-2 text-mist">Quản lý tài khoản, reset mật khẩu và xoá user.</p>
      <div className="mt-8">
        <UsersTable />
      </div>
    </div>
  )
}
