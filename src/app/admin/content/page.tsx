import { requireAdmin } from '@/lib/admin'
import CuratedManager from '@/components/admin-curated-manager'

export const dynamic = 'force-dynamic'

export default async function AdminContentPage() {
  await requireAdmin()
  return (
    <div>
      <h1 className="text-2xl font-bold text-paper">Nội dung</h1>
      <p className="mt-2 text-mist">
        Chọn phim hiển thị nổi bật trên trang chủ (Editor&apos;s picks). Kéo nút ↑/↓ để đổi thứ tự.
      </p>
      <div className="mt-8">
        <CuratedManager />
      </div>
    </div>
  )
}
