import CategoryBrowser from '@/components/category-browser'
import { displayName, GENRES } from '@/lib/categories'
import { fetchByGenre } from '@/lib/nguonc'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return { title: `Phim thể loại ${displayName(GENRES, slug)}` }
}

export default async function GenrePage({
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
      title={`Thể loại: ${displayName(GENRES, slug)}`}
      basePath={`/the-loai/${slug}`}
      page={page}
      fetcher={(p) => fetchByGenre(slug, p)}
    />
  )
}
