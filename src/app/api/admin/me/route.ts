import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

/** Trả thông tin admin hiện tại. Bị chặn 401/403 bởi requireAdmin. */
export async function GET() {
  try {
    const user = await requireAdmin({ api: true })
    return NextResponse.json({ username: user.username, isAdmin: user.isAdmin })
  } catch (err) {
    const e = err as { status?: number }
    const status = e?.status ?? 500
    return NextResponse.json({ error: status === 401 ? 'unauthenticated' : 'forbidden' }, { status })
  }
}
