'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { KeyRound, LogOut } from 'lucide-react'

export default function UserMenu({ username }: { username: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleLogout() {
    if (busy) return
    setBusy(true)
    try {
      await fetch('/api/thoat', { method: 'POST' })
      window.location.assign('/dang-nhap')
    } finally {
      setBusy(false)
    }
  }

  function openDialog() {
    setOldPassword('')
    setNewPassword('')
    setStatus(null)
    setDialogOpen(true)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    setStatus(null)
    try {
      const res = await fetch('/api/doi-mat-khau', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus({ ok: true, msg: 'Đã đổi mật khẩu. Vui lòng đăng nhập lại.' })
        setTimeout(() => {
          setDialogOpen(false)
          window.location.assign('/dang-nhap')
        }, 1200)
      } else {
        setStatus({ ok: false, msg: data.error ?? 'Không đổi được mật khẩu.' })
      }
    } catch {
      setStatus({ ok: false, msg: 'Lỗi mạng. Thử lại.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2.5">
      <span className="hidden max-w-[120px] truncate text-[13px] font-medium text-mist sm:block">
        {username}
      </span>

      <button
        type="button"
        onClick={openDialog}
        title="Đổi mật khẩu"
        aria-label="Đổi mật khẩu"
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-graphite bg-carbon/90 px-2.5 text-[12px] font-medium text-mist outline-none backdrop-blur-sm transition-colors hover:border-acid-lime/50 hover:text-paper disabled:opacity-50 sm:h-9"
      >
        <KeyRound size={14} strokeWidth={2} aria-hidden />
        <span className="hidden sm:inline">Đổi MK</span>
      </button>

      <button
        type="button"
        onClick={handleLogout}
        disabled={busy}
        title="Đăng xuất"
        aria-label="Đăng xuất"
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-graphite bg-carbon/90 px-2.5 text-[12px] font-medium text-mist outline-none backdrop-blur-sm transition-colors hover:border-acid-lime/50 hover:text-paper disabled:opacity-50 sm:h-9"
      >
        <LogOut size={14} strokeWidth={2} aria-hidden />
        <span className="hidden sm:inline">Thoát</span>
      </button>

      {dialogOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          onClick={() => !saving && setDialogOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-graphite bg-carbon p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-[16px] font-semibold text-paper">Đổi mật khẩu</h2>
            <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
              <label className="text-[13px] text-mist">
                Mật khẩu hiện tại
                <input
                  type="password"
                  autoComplete="current-password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="mt-1 h-9 w-full rounded-md border border-graphite bg-void px-3 text-[14px] text-paper outline-none focus:border-acid-lime/60"
                />
              </label>
              <label className="text-[13px] text-mist">
                Mật khẩu mới (6-128 ký tự)
                <input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="mt-1 h-9 w-full rounded-md border border-graphite bg-void px-3 text-[14px] text-paper outline-none focus:border-acid-lime/60"
                />
              </label>

              {status && (
                <p className={`text-[13px] ${status.ok ? 'text-acid-lime' : 'text-red-400'}`}>
                  {status.msg}
                </p>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  disabled={saving}
                  className="rounded-md border border-graphite px-3 py-2 text-[13px] text-mist transition-colors hover:text-paper disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-acid-lime px-4 py-2 text-[13px] font-semibold text-void transition-opacity disabled:opacity-50"
                >
                  {saving ? 'Đang lưu…' : 'Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
