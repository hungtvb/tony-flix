import CategoryIndex from '@/components/category-index'
import { COUNTRIES } from '@/lib/categories'

export const revalidate = 3600

export async function generateMetadata() {
  return { title: 'Quốc gia - TonyFlix' }
}

export default function Page() {
  return (
    <CategoryIndex
      title="Quốc gia"
      description="Chọn quốc gia để xem danh sách phim tương ứng."
      basePath="/quoc-gia"
      options={COUNTRIES}
    />
  )
}
