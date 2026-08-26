'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

const LINKS = [
  { href: '/', label: 'Trang chủ' },
  { href: '/moi-cap-nhat', label: 'Mới cập nhật' },
  { href: '/the-loai', label: 'Thể loại' },
  { href: '/quoc-gia', label: 'Quốc gia' },
  { href: '/nam-phat-hanh', label: 'Năm phát hành' },
  { href: '/yeu-thich', label: 'Yêu thích' },
]

export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  // Đóng khi click ra ngoài panel / nút
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node
      if (panelRef.current?.contains(target) || btnRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  // Đóng khi nhấn Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={open ? 'Đóng menu' : 'Mở menu'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 items-center justify-center rounded-lg text-paper transition-colors hover:bg-white/10 sm:hidden"
      >
        {open ? <X size={20} strokeWidth={2} aria-hidden /> : <Menu size={20} strokeWidth={2} aria-hidden />}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute inset-x-0 top-full mt-2 rounded-xl border border-graphite bg-carbon/95 p-2 shadow-2xl backdrop-blur-md sm:hidden"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-4 py-3 text-[15px] text-bone transition-colors hover:bg-white/5 hover:text-paper"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
