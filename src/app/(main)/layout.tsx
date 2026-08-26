import Navbar from '@/components/navbar'

/** Layout cho các trang xem phim — có navbar (search + user menu) và footer. */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-8">{children}</main>
      <footer className="mt-16 border-t border-white/10 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-[13px] text-ash sm:flex-row sm:px-8">
          <p className="font-semibold tracking-tight text-fog">TONYFLIX</p>
          <p>Xem phim — mọi lúc.</p>
        </div>
      </footer>
    </>
  )
}
