import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Navbar from '@/components/navbar'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter-variable',
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tony-flix-production.up.railway.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'TonyFlix — Xem Phim Online HD Vietsub',
    template: '%s · TonyFlix',
  },
  description:
    'TonyFlix — xem phim online HD Vietsub: phim bộ, phim lẻ, anime, Hàn Quốc, Trung Quốc cập nhật liên tục. Theo dõi tiến độ và đánh dấu phim yêu thích.',
  keywords: ['xem phim online', 'phim hay', 'vietsub', 'phim bộ', 'anime', 'hanh dong', 'tinh cam', 'TonyFlix'],
  authors: [{ name: 'TonyFlix' }],
  applicationName: 'TonyFlix',
  manifest: '/manifest.webmanifest',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: SITE_URL,
    siteName: 'TonyFlix',
    title: 'TonyFlix — Xem Phim Online HD Vietsub',
    description: 'Xem phim online HD Vietsub — phim bộ, phim lẻ, anime cập nhật liên tục.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TonyFlix — Xem Phim Online HD Vietsub',
    description: 'Xem phim online HD Vietsub — phim bộ, phim lẻ, anime cập nhật liên tục.',
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg' }],
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#0b0b0d',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TonyFlix',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/tim-kiem?keyword={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <html lang="vi" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
