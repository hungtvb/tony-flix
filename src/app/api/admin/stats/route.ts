import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { getAdminStats } from '@/lib/db'

/** GET thống kê quản trị. Bị chặn 401/403 bởi requireAdmin. */
export async function GET() {
  try {
    await requireAdmin({ api: true })
    const stats = await getAdminStats()
    return NextResponse.json(stats)
  } catch (err) {
    const e = err as { status?: number }
    const status = e?.status ?? 500
    return NextResponse.json({ error: status === 401 ? 'unauthenticated' : 'forbidden' }, { status })
  }
}
