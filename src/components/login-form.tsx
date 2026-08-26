'use client'

import { useState, type FormEvent } from 'react'
import { Lock } from 'lucide-react'

export default function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/dang-nhap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Đăng nhập thất bại. Thử lại sau.')
        return
      }
      // Session cookie is set — do a FULL page load so the very next request
      // already carries the cookie. Client-side router.replace() races with
      // the auth middleware and can bounce back to /dang-nhap.
      const params = new URLSearchParams(window.location.search)
      const next = params.get('next')
      window.location.assign(next && next.startsWith('/') ? next : '/')
    } catch {
      setError('Không kết nối được máy chủ. Thử lại sau.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="username" className="block text-[13px] font-medium text-fog">
          Tên tài khoản
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-2 h-11 w-full rounded-md border border-graphite bg-carbon px-3.5 text-[15px] text-paper outline-none transition-colors placeholder:text-ash focus:border-acid-lime/60 focus:ring-1 focus:ring-acid-lime/40"
          placeholder="vd: admin"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-[13px] font-medium text-fog">
          Mật khẩu
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 h-11 w-full rounded-md border border-graphite bg-carbon px-3.5 text-[15px] text-paper outline-none transition-colors placeholder:text-ash focus:border-acid-lime/60 focus:ring-1 focus:ring-acid-lime/40"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-coral-red/30 bg-coral-red/10 px-3.5 py-2.5 text-[13px] text-coral-red">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-acid-lime text-[15px] font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <Lock size={16} strokeWidth={2.5} aria-hidden />
        {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
      </button>
    </form>
  )
}
