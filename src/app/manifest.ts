import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TonyFlix',
    short_name: 'TonyFlix',
    description: 'Xem phim online HD Vietsub — phim bộ, phim lẻ, anime cập nhật liên tục.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0b0d',
    theme_color: '#0b0b0d',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    categories: ['entertainment'],
    lang: 'vi',
    orientation: 'portrait',
  }
}
