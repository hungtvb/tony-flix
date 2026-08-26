import CategoryBrowser from '@/components/category-browser'
import { displayName, COUNTRIES } from '@/lib/categories'
import { fetchByCountry } from '@/lib/nguonc'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return { title: `Phim ${displayName(COUNTRIES, slug)}` }
}

export default async function CountryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1)

  return (
    <CategoryBrowser
      key={slug}
      title={`Quốc gia: ${displayName(COUNTRIES, slug)}`}
      basePath={`/quoc-gia/${slug}`}
      page={page}
      fetcher={(p) => fetchByCountry(slug, p)}
    />
  )
}
