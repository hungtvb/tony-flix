'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

/**
 * Ô tìm kiếm: trên desktop hiển thị input thường; trên mobile thu gọn thành
 * icon, bấm vào mới bung input toàn chiều rộng để không làm chật navbar.
 */
export default function SearchBox() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const q = value.trim()
    if (!q) return
    setOpen(false)
    router.push(`/tim-kiem?keyword=${encodeURIComponent(q)}`)
  }

  return (
    <>
      {/* Desktop: input thường */}
      <form action="/tim-kiem" className="relative hidden items-center sm:flex" role="search">
        <Search size={15} strokeWidth={2} className="pointer-events-none absolute left-3 text-ash" aria-hidden />
        <input
          type="search"
          name="keyword"
          placeholder="Tìm phim…"
          autoComplete="off"
          className="h-9 w-48 rounded-md border border-graphite bg-carbon/90 pl-9 pr-3 text-[13px] text-paper outline-none backdrop-blur-sm transition-all placeholder:text-ash focus:w-56 focus:border-smoke"
        />
      </form>

      {/* Mobile: icon toggle */}
      <button
        type="button"
        aria-label="Tìm kiếm"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-paper transition-colors hover:bg-white/10 sm:hidden"
      >
        {open ? <X size={17} strokeWidth={2} aria-hidden /> : <Search size={17} strokeWidth={2} aria-hidden />}
      </button>

      {/* Mobile: input bung ra khi open */}
      {open && (
        <form
          onSubmit={submit}
          className="absolute inset-x-0 top-14 z-50 flex items-center gap-2 border-t border-white/10 bg-void/98 px-4 py-2.5 backdrop-blur sm:hidden"
          role="search"
        >
          <Search size={15} strokeWidth={2} className="shrink-0 text-ash" aria-hidden />
          <input
            autoFocus
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Tìm phim…"
            autoComplete="off"
            className="h-9 w-full rounded-md border border-graphite bg-carbon px-3 text-[14px] text-paper outline-none placeholder:text-ash focus:border-acid-lime/60"
          />
        </form>
      )}
    </>
  )
}
