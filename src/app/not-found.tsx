import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 pt-20 text-center">
      <p className="font-mono text-[13px] uppercase tracking-widest text-ash">404 — Not Found</p>
      <h1 className="text-[32px] font-medium tracking-tight text-paper">Không tìm thấy trang này</h1>
      <Link
        href="/"
        className="mt-2 inline-flex h-9 items-center rounded-md bg-acid-lime px-4 text-[14px] font-medium text-void hover:opacity-90"
      >
        Về trang chủ
      </Link>
    </div>
  )
}
