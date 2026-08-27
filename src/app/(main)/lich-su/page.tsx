import WatchHistory from '@/components/watch-history'

export const metadata = { title: 'Lịch sử xem' }

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-6xl pb-16">
      <h1 className="px-4 pt-6 text-[22px] font-bold tracking-tight text-paper sm:px-0 sm:pt-8 sm:text-3xl">
        Lịch sử xem
      </h1>
      <p className="mb-5 px-4 pt-1 text-[13px] text-mist sm:px-0 sm:text-[14px]">
        Các phim bạn đã xem gần đây. Nhấn vào để tiếp tục.
      </p>
      <WatchHistory />
    </div>
  )
}
