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
  description: 'Xem phim online HD Vietsub — phim bộ, phim lẻ, anime cập nhật liên tục. Nguồn dữ liệu NguonC.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 pb-24">{children}</main>
        <footer className="border-t border-graphite/60 py-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-[12px] text-ash sm:flex-row">
            <p>
              TonyFlix — dữ liệu từ{' '}
              <a href="https://phim.nguonc.com" className="text-fog underline-offset-2 hover:text-mist hover:underline">
                NguonC API
              </a>
            </p>
            <p>Design: Linear style via styles.refero.design</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
