'use client'

import { useEffect, useRef, useState } from 'react'
import { KeyRound, LogOut } from 'lucide-react'

export default function UserMenu({ username }: { username: string }) {
  const [open, setOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const busyLogout = useRef(false)

  const initial = (username.trim()[0] ?? '?').toUpperCase()

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  async function handleLogout() {
    if (busyLogout.current) return
    busyLogout.current = true
    try {
      await fetch('/api/thoat', { method: 'POST', credentials: 'same-origin' })
      window.location.assign('/dang-nhap')
    } finally {
      busyLogout.current = false
    }
  }

  function openDialog() {
    setOldPassword('')
    setNewPassword('')
    setStatus(null)
    setOpen(false)
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
        credentials: 'same-origin',
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
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Tài khoản"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-acid-lime text-[15px] font-bold text-void outline-none transition-transform hover:scale-105"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-lg border border-ash/20 bg-ink/95 p-1.5 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-acid-lime text-[13px] font-bold text-void">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-paper">{username}</p>
              <p className="text-[11px] text-fog">Tài khoản</p>
            </div>
          </div>
          <div className="my-1 h-px bg-white/10" />
          <button
            type="button"
            onClick={openDialog}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-bone transition-colors hover:bg-white/10 hover:text-paper"
          >
            <KeyRound size={15} strokeWidth={2} aria-hidden />
            Đổi mật khẩu
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-bone transition-colors hover:bg-white/10 hover:text-paper"
          >
            <LogOut size={15} strokeWidth={2} aria-hidden />
            Đăng xuất
          </button>
        </div>
      )}

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
