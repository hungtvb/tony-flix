import CategoryIndex from '@/components/category-index'
import { YEARS } from '@/lib/categories'

export const revalidate = 3600

export async function generateMetadata() {
  return { title: 'Năm phát hành - TonyFlix' }
}

export default function Page() {
  return (
    <CategoryIndex
      title="Năm phát hành"
      description="Chọn năm để xem danh sách phim ra mắt trong năm đó."
      basePath="/nam-phat-hanh"
      options={YEARS}
    />
  )
}
