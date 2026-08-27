'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

/**
 * Theme toggle (dark default). Persists choice in localStorage and flips
 * data-theme on <html> so the CSS variable overrides in globals.css take effect.
 * A blocking inline script in layout.tsx applies the saved theme before paint
 * to avoid a flash of the wrong theme.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme') as 'dark' | 'light' | null
    if (current) setTheme(current)
  }, [])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem('tf-theme', next)
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-mist transition-colors hover:border-white/40 hover:text-paper"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
