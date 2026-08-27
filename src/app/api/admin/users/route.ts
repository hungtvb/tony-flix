import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { listUsers } from '@/lib/db'

/** GET danh sách user (phân trang + tìm kiếm). requireAdmin. */
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin({ api: true })
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? '1') || 1
    const pageSize = Number(url.searchParams.get('pageSize') ?? '20') || 20
    const search = url.searchParams.get('search') ?? undefined
    const result = await listUsers({ page, pageSize, search })
    return NextResponse.json(result)
  } catch (err) {
    const e = err as { status?: number }
    const status = e?.status ?? 500
    return NextResponse.json({ error: status === 401 ? 'unauthenticated' : 'forbidden' }, { status })
  }
}
