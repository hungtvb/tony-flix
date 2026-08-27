import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { getAdminStats } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const admin = await requireAdmin()
  const stats = await getAdminStats()

  return (
    <div>
      <h1 className="text-2xl font-bold text-paper">Dashboard</h1>
      <p className="mt-2 text-mist">
        Xin chào <span className="font-semibold text-acid-lime">{admin.username}</span>.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tổng người dùng" value={stats.totalUsers} />
        <StatCard label="User mới (7 ngày)" value={stats.newUsers7d} />
        <StatCard label="Lượt yêu thích" value={stats.totalFavorites} />
        <StatCard label="Lượt xem" value={stats.totalWatchProgress} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Panel title="Top phim xem nhiều">
          {stats.topFilms.length === 0 ? (
            <Empty />
          ) : (
            <ol className="space-y-2 text-sm">
              {stats.topFilms.map((f, i) => (
                <li key={f.filmSlug} className="flex items-center justify-between gap-3">
                  <span className="truncate text-mist">
                    <span className="mr-2 text-acid-lime">{i + 1}.</span>
                    {f.filmSlug}
                  </span>
                  <span className="shrink-0 rounded bg-white/5 px-2 py-0.5 text-xs text-bone">{f.views}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title="Top user theo yêu thích">
          {stats.topUsers.length === 0 ? (
            <Empty />
          ) : (
            <ol className="space-y-2 text-sm">
              {stats.topUsers.map((u, i) => (
                <li key={u.username} className="flex items-center justify-between gap-3">
                  <span className="truncate text-mist">
                    <span className="mr-2 text-acid-lime">{i + 1}.</span>
                    {u.username}
                  </span>
                  <span className="shrink-0 rounded bg-white/5 px-2 py-0.5 text-xs text-bone">{u.favorites}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="text-3xl font-bold text-paper">{value}</div>
      <div className="mt-1 text-sm text-mist">{label}</div>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h2 className="mb-4 text-lg font-semibold text-paper">{title}</h2>
      {children}
    </section>
  )
}

function Empty() {
  return <p className="text-sm text-mist/60">Chưa có dữ liệu.</p>
}
