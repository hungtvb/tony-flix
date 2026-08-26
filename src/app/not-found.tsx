import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 pt-20 text-center">
      <p className="text-[64px] font-extrabold tracking-tight text-acid-lime">404</p>
      <h1 className="-mt-2 text-[22px] font-semibold tracking-tight text-paper">Không tìm thấy trang này</h1>
      <Link
        href="/"
        className="mt-2 inline-flex h-10 items-center rounded-md bg-acid-lime px-5 text-[14px] font-medium text-void transition-opacity hover:opacity-90"
      >
        Về trang chủ
      </Link>
    </div>
  )
}
