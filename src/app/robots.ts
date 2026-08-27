import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tonyflix.up.railway.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dang-nhap', '/dang-ky', '/yeu-thich', '/xem/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
