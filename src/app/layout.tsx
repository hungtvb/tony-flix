import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navbar from '@/components/navbar'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter-variable',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'TonyFlix — Xem Phim Online HD Vietsub',
    template: '%s · TonyFlix',
  },
  description: 'Xem phim online HD Vietsub — phim bộ, phim lẻ, anime cập nhật liên tục.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 sm:px-8">{children}</main>
        <footer className="mt-16 border-t border-white/10 py-10">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-[13px] text-ash sm:flex-row sm:px-8">
            <p className="font-semibold tracking-tight text-fog">TONYFLIX</p>
            <p>Xem phim — mọi lúc.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
