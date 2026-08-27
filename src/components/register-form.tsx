'use client'

import { useState, type FormEvent } from 'react'
import { UserPlus } from 'lucide-react'
import Link from 'next/link'

export default function RegisterForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    if (password !== confirm) {
      setError('Mật khẩu nhập lại không khớp.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/dang-ky', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ username, password }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Đăng ký thất bại. Thử lại sau.')
        return
      }
      // Session cookie is set — FULL page load so the next request carries it.
      window.location.assign('/')
    } catch {
      setError('Không kết nối được máy chủ. Thử lại sau.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
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
            placeholder="3-24 ký tự, chữ thường/số/gạch dưới"
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
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-graphite bg-carbon px-3.5 text-[15px] text-paper outline-none transition-colors placeholder:text-ash focus:border-acid-lime/60 focus:ring-1 focus:ring-acid-lime/40"
            placeholder="Tối thiểu 6 ký tự"
          />
        </div>

        <div>
          <label htmlFor="confirm" className="block text-[13px] font-medium text-fog">
            Nhập lại mật khẩu
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
          <UserPlus size={16} strokeWidth={2.5} aria-hidden />
          {submitting ? 'Đang tạo tài khoản…' : 'Đăng ký'}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-fog">
        Đã có tài khoản?{' '}
        <Link href="/dang-nhap" className="font-semibold text-acid-lime hover:underline">
          Đăng nhập
        </Link>
      </p>
    </>
  )
}
