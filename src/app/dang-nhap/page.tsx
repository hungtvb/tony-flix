import type { Metadata } from 'next'
import LoginForm from '@/components/login-form'

export const metadata: Metadata = {
  title: 'Đăng nhập',
}

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-16">
      {/* Brand */}
      <div className="text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-acid-lime text-void shadow-lg">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 5.14v13.72L19 12 8 5.14z" />
          </svg>
        </span>
        <h1 className="mt-5 text-[28px] font-extrabold tracking-tight text-paper">TONYFLIX</h1>
        <p className="mt-2 text-[14px] text-fog">Đăng nhập để xem phim.</p>
      </div>

      <LoginForm />
    </div>
  )
}
