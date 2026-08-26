import Link from 'next/link'
import { ChevronLeft, Info, Play } from 'lucide-react'
import FilmCard from '@/components/film-card'
import CategoryRow from '@/components/category-row'
import { fetchLatestFilms } from '@/lib/nguonc'
import type { FilmListItem } from '@/lib/types'

export const revalidate = 60

/** Các hàng danh mục trên trang chủ (slugs đã verify với NguonC API). */
const CATEGORY_ROWS: {
  title: string
  kind: 'the-loai' | 'quoc-gia' | 'nam-phat-hanh'
  slug: string
  viewAllHref?: string
}[] = [
  { title: 'Hành Động', kind: 'the-loai', slug: 'hanh-dong', viewAllHref: '/the-loai/hanh-dong' },
  { title: 'Phim Hàn Quốc', kind: 'quoc-gia', slug: 'han-quoc', viewAllHref: '/quoc-gia/han-quoc' },
  { title: 'Kinh Dị', kind: 'the-loai', slug: 'kinh-di', viewAllHref: '/the-loai/kinh-di' },
  { title: 'Anime Nhật Bản', kind: 'quoc-gia', slug: 'nhat-ban', viewAllHref: '/quoc-gia/nhat-ban' },
  { title: 'Hoạt Hình', kind: 'the-loai', slug: 'hoat-hinh', viewAllHref: '/the-loai/hoat-hinh' },
  { title: 'Phim Trung Quốc', kind: 'quoc-gia', slug: 'trung-quoc', viewAllHref: '/quoc-gia/trung-quoc' },
  { title: 'Cổ Trang', kind: 'the-loai', slug: 'co-trang', viewAllHref: '/the-loai/co-trang' },
  { title: 'Viễn Tưởng', kind: 'the-loai', slug: 'khoa-hoc-vien-tuong', viewAllHref: '/the-loai/khoa-hoc-vien-tuong' },
  { title: 'Phim Mới 2025', kind: 'nam-phat-hanh', slug: '2025', viewAllHref: '/nam-phat-hanh/2025' },
]

/** Horizontal scrolling film row, Netflix style (server-rendered). */
function FilmRow({ title, films }: { title: string; films: FilmListItem[] }) {
  if (films.length === 0) return null
  return (
    <section className="mt-9">
      <h2 className="mb-3 px-4 text-[20px] font-semibold tracking-tight text-paper sm:px-0">{title}</h2>
      <div className="no-scrollbar -mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-3 sm:px-0">
        {films.map((film) => (
          <div key={film.slug} className="w-[132px] shrink-0 snap-start sm:w-[152px] md:w-[168px]">
            <FilmCard film={film} />
          </div>
        ))}
      </div>
    </section>
  )
}

export default async function HomePage() {
  let items: FilmListItem[] = []
  try {
    const data = await fetchLatestFilms(1)
    items = data.items
  } catch {
    items = []
  }

  const hero = items[0]
  const rest: FilmListItem[] = items.slice(1)

  return (
    <div>
      {/* Billboard hero */}
      <section className="relative -mx-4 -mt-14 flex min-h-[62vh] items-end overflow-hidden sm:min-h-[72vh]">
        {hero ? (
          <>
            <div className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={hero.thumb_url || hero.poster_url} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-void via-void/70 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-void to-transparent" />
            </div>
            <div className="relative z-10 max-w-xl px-4 pb-16 pt-32">
              <p className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-fog">
                <span className="inline-block h-4 w-1 rounded-full bg-acid-lime" />
                {hero.quality ? hero.quality : 'Đề xuất hôm nay'}
              </p>
              <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-paper drop-shadow-lg sm:text-5xl">
                {hero.name}
              </h1>
              <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-mist/90 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden">
                {(hero.description || '').replace(/<[^>]*>/g, '').slice(0, 220)}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href={`/xem/${hero.slug}`}
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-acid-lime px-6 text-[15px] font-semibold text-void transition-opacity hover:opacity-90"
                >
                  <Play size={16} strokeWidth={2.5} fill="currentColor" aria-hidden />
                  Xem ngay
                </Link>
                <Link
                  href={`/phim/${hero.slug}`}
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-white/10 px-5 text-[15px] font-medium text-paper backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  <Info size={16} strokeWidth={2} aria-hidden />
                  Thông tin
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="relative z-10 px-4 py-28">
            <h1 className="text-4xl font-bold tracking-tight text-paper">TonyFlix</h1>
            <p className="mt-3 text-[15px] text-fog">Đang cập nhật phim — thử tải lại trang sau vài giây.</p>
          </div>
        )}
      </section>

      {/* Rows: Mới cập nhật + danh mục đa dạng để user cuộn xuống */}
      <div className="pb-10">
        <FilmRow title="Mới cập nhật" films={rest} />
        {CATEGORY_ROWS.map((row) => (
          <CategoryRow key={row.title} {...row} />
        ))}
      </div>
    </div>
  )
}
