'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { CategoryOption } from '@/lib/categories'

/**
 * Dropdown menu cho navbar: hiển thị lưới các danh mục (thể loại / quốc gia / năm).
 * Desktop: hover + click mở; Mobile: chỉ click (hover không có trên touch).
 */
export default function CategoryMenu({
  label,
  options,
  basePath,
}: {
  label: string
  options: CategoryOption[]
  basePath: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1 text-[14px] text-mist transition-colors hover:text-paper"
      >
        {label}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-lg border border-ash/20 bg-ink/95 p-2 shadow-xl backdrop-blur-md">
          <div className="grid grid-cols-2 gap-1">
            {options.map((opt) => (
              <Link
                key={opt.slug}
                href={`${basePath}/${opt.slug}`}
                onClick={() => setOpen(false)}
                className="rounded-md px-2.5 py-1.5 text-[13px] text-bone transition-colors hover:bg-white/10 hover:text-paper"
              >
                {opt.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
