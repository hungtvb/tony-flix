'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LogOut } from 'lucide-react'

export default function UserMenu({ username }: { username: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleLogout() {
    if (busy) return
    setBusy(true)
    try {
      await fetch('/api/thoat', { method: 'POST' })
      // Hard navigation — guarantees the cleared cookie is used immediately.
      window.location.assign('/dang-nhap')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2.5">
      <span className="hidden max-w-[120px] truncate text-[13px] font-medium text-mist sm:block">
        {username}
      </span>
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
    </div>
  )
}
