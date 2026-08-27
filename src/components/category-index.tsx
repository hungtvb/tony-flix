import Link from 'next/link'
import type { CategoryOption } from '@/lib/categories'

/** Trang tổng duyệt danh mục: hiển thị lưới các option (thể loại / quốc gia / năm). */
export default function CategoryIndex({
  title,
  description,
  basePath,
  options,
}: {
  title: string
  description: string
  basePath: string
  options: CategoryOption[]
}) {
  return (
    <div className="pt-24">
      <h1 className="text-[28px] font-bold tracking-tight text-paper">{title}</h1>
      <p className="mb-6 mt-1 text-[14px] text-fog">{description}</p>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-3">
        {options.map((opt) => (
          <Link
            key={opt.slug}
            href={`${basePath}/${opt.slug}`}
            className="group flex h-20 items-center justify-center rounded-lg border border-graphite bg-carbon/60 text-center text-[15px] font-medium text-bone transition-colors hover:border-acid-lime/50 hover:bg-acid-lime/10 hover:text-acid-lime sm:text-[16px]"
          >
            {opt.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
