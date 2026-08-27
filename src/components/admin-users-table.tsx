'use client'

import { useEffect, useState, useCallback } from 'react'

interface UserRow {
  id: string
  isAdmin: boolean
  createdAt: string
}

export default function UsersTable() {
  const [items, setItems] = useState<UserRow[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError('')
    const params = new URLSearchParams({ page: String(page), pageSize: '20' })
    if (search.trim()) params.set('search', search.trim())
    const res = await fetch(`/api/admin/users?${params.toString()}`)
    if (!res.ok) {
      setError('Không tải được danh sách.')
      return
    }
    const body = await res.json()
    setItems(body.items ?? [])
    setTotal(body.total ?? 0)
  }, [page, search])

  useEffect(() => {
    load()
  }, [load])

  async function onReset(id: string) {
    if (!confirm(`Reset mật khẩu của "${id}" về mặc định?`)) return
    setBusy(id + ':reset')
    const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    setBusy(null)
    if (res.ok) {
      const b = await res.json().catch(() => ({}))
      alert(`Đã reset. Mật khẩu mới: ${b.password ?? '(mặc định)'}`)
    } else {
      alert('Reset thất bại.')
    }
  }

  async function onDelete(id: string) {
    if (!confirm(`Xoá user "${id}" và toàn bộ dữ liệu liên quan?`)) return
    setBusy(id + ':del')
    const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' })
    setBusy(null)
    if (res.ok) {
      setItems((prev) => prev.filter((u) => u.id !== id))
      setTotal((t) => Math.max(0, t - 1))
    } else {
      alert('Xoá thất bại.')
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Tìm theo tên user..."
          className="w-64 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-bone outline-none focus:border-acid-lime"
        />
        <span className="text-sm text-mist">Tổng: {total}</span>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-mist">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Quyền</th>
              <th className="px-4 py-3 font-medium">Ngày tạo</th>
              <th className="px-4 py-3 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id} className="border-t border-white/5">
                <td className="px-4 py-3 text-bone">{u.id}</td>
                <td className="px-4 py-3">
                  {u.isAdmin ? (
                    <span className="rounded bg-acid-lime/20 px-2 py-0.5 text-xs text-acid-lime">admin</span>
                  ) : (
                    <span className="text-mist">user</span>
                  )}
                </td>
                <td className="px-4 py-3 text-mist">{u.createdAt}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    disabled={busy !== null || u.isAdmin}
                    onClick={() => onReset(u.id)}
                    className="mr-2 rounded-md border border-white/10 px-2.5 py-1 text-xs text-bone transition-colors hover:border-acid-lime/50 disabled:opacity-40"
                  >
                    Reset MK
                  </button>
                  <button
                    disabled={busy !== null || u.isAdmin}
                    onClick={() => onDelete(u.id)}
                    className="rounded-md border border-red-500/30 px-2.5 py-1 text-xs text-red-300 transition-colors hover:border-red-500 disabled:opacity-40"
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-mist/60">
                  Không có user nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="rounded-md border border-white/10 px-3 py-1.5 text-sm text-bone disabled:opacity-40"
        >
          Trước
        </button>
        <span className="text-sm text-mist">Trang {page}</span>
        <button
          disabled={items.length < 20}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-md border border-white/10 px-3 py-1.5 text-sm text-bone disabled:opacity-40"
        >
          Sau
        </button>
      </div>
    </div>
  )
}
