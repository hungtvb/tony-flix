import CategoryIndex from '@/components/category-index'
import { GENRES } from '@/lib/categories'

export const revalidate = 3600

export async function generateMetadata() {
  return { title: 'Thể loại phim - TonyFlix' }
}

export default function Page() {
  return (
    <CategoryIndex
      title="Thể loại phim"
      description="Chọn thể loại để xem danh sách phim tương ứng."
      basePath="/the-loai"
      options={GENRES}
    />
  )
}
