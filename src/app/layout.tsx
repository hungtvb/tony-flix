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
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
