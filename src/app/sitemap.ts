import type { MetadataRoute } from 'next'
import { GENRES, COUNTRIES, YEARS } from '@/lib/categories'
import { fetchLatestFilms } from '@/lib/nguonc'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tony-flix-production.up.railway.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'always' as const, priority: 1 },
    { url: `${SITE_URL}/moi-cap-nhat`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${SITE_URL}/the-loai`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.6 },
    { url: `${SITE_URL}/quoc-gia`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.6 },
    { url: `${SITE_URL}/nam-phat-hanh`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.6 },
  ]

  const genreRoutes = GENRES.map((g) => ({
    url: `${SITE_URL}/the-loai/${g.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))
  const countryRoutes = COUNTRIES.map((c) => ({
    url: `${SITE_URL}/quoc-gia/${c.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))
  const yearRoutes = YEARS.map((y) => ({
    url: `${SITE_URL}/nam-phat-hanh/${y.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  // Một số phim mới nhất để giúp crawler index trang chi tiết
  let filmRoutes: MetadataRoute.Sitemap = []
  try {
    const latest = await fetchLatestFilms(1)
    filmRoutes = latest.items.map((f) => ({
      url: `${SITE_URL}/phim/${f.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch {
    filmRoutes = []
  }

  return [...staticRoutes, ...genreRoutes, ...countryRoutes, ...yearRoutes, ...filmRoutes]
}
