import Link from 'next/link'
import { ChevronLeft, Info, Play } from 'lucide-react'
import FilmCard from '@/components/film-card'
import CategoryRow from '@/components/category-row'
import ContinueWatching from '@/components/continue-watching'
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

/** Hàng phim cuộn ngang, card nhỏ gọn hơn trên mobile. */
const CARD_W = 'w-[104px] shrink-0 snap-start sm:w-[152px] md:w-[168px]'

function rowCls(extra = '') {
  return `no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-3 sm:px-0 ${extra}`
}

/** Horizontal scrolling film row, Netflix style (server-rendered). */
function FilmRow({ title, films }: { title: string; films: FilmListItem[] }) {
  if (films.length === 0) return null
  return (
    <section className="mt-7 sm:mt-9">
      <h2 className="mb-2.5 px-4 text-[17px] font-semibold tracking-tight text-paper sm:mb-3 sm:px-0 sm:text-[20px]">{title}</h2>
      <div className={rowCls()}>
        {films.map((film) => (
          <div key={film.slug} className={CARD_W}>
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
      <section className="relative -mx-4 -mt-[52px] flex min-h-[58vh] items-end overflow-hidden sm:-mt-14 sm:min-h-[72vh]">
        {hero ? (
          <>
            <div className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={hero.thumb_url || hero.poster_url} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-void via-void/70 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-void to-transparent" />
            </div>
            <div className="relative z-10 max-w-xl px-4 pb-12 pt-32 sm:pb-16">
              <p className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-fog sm:mb-3 sm:text-[12px]">
                <span className="inline-block h-4 w-1 rounded-full bg-acid-lime" />
                {hero.quality ? hero.quality : 'Đề xuất hôm nay'}
              </p>
              <h1 className="text-[28px] font-bold leading-[1.08] tracking-tight text-paper drop-shadow-lg sm:text-5xl">
                {hero.name}
              </h1>
              <p className="mt-3 hidden text-[15px] leading-relaxed text-mist/90 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden sm:block">
                {(hero.description || '').replace(/<[^>]*>/g, '').slice(0, 220)}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3 sm:mt-6">
                <Link
                  href={`/xem/${hero.slug}`}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-acid-lime px-5 text-[14px] font-semibold text-void transition-opacity hover:opacity-90 sm:h-11 sm:px-6 sm:text-[15px]"
                >
                  <Play size={16} strokeWidth={2.5} fill="currentColor" aria-hidden />
                  Xem ngay
                </Link>
                <Link
                  href={`/phim/${hero.slug}`}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-white/10 px-4 text-[14px] font-medium text-paper backdrop-blur-sm transition-colors hover:bg-white/20 sm:h-11 sm:px-5 sm:text-[15px]"
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

      {/* Rows: Tiếp tục xem (theo user, client-side) + Mới cập nhật + danh mục */}
      <div className="pb-10">
        <ContinueWatching />
        <FilmRow title="Mới cập nhật" films={rest} />
        {CATEGORY_ROWS.map((row) => (
          <CategoryRow key={row.title} {...row} />
        ))}
      </div>
    </div>
  )
}
