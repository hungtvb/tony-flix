import CategoryBrowser from '@/components/category-browser'
import { fetchByYear } from '@/lib/nguonc'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params
  return { title: `Phim năm ${year}` }
}

export default async function YearPage({
  params,
  searchParams,
}: {
  params: Promise<{ year: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const [{ year }, query] = await Promise.all([params, searchParams])
  if (!/^\d{4}$/.test(year)) throw new Error('invalid year')
  const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1)

  return (
    <CategoryBrowser
      key={year}
      title={`Phim năm ${year}`}
      basePath={`/nam-phat-hanh/${year}`}
      page={page}
      fetcher={(p) => fetchByYear(year, p)}
    />
  )
}
