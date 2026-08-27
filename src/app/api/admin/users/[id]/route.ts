import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { resetUserPassword, deleteUser } from '@/lib/db'

const DEFAULT_RESET_PASSWORD = 'tonyflix'

/** DELETE xoá user (không cho xoá chính mình). requireAdmin. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin({ api: true })
    const { id } = await params
    if (id.trim().toLowerCase() === admin.username.trim().toLowerCase()) {
      return NextResponse.json({ error: 'cannot delete self' }, { status: 400 })
    }
    const ok = await deleteUser(admin.username, id)
    if (!ok) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const e = err as { status?: number }
    const status = e?.status ?? 500
    return NextResponse.json({ error: status === 401 ? 'unauthenticated' : 'forbidden' }, { status })
  }
}

/** PUT reset mật khẩu user về mặc định (không cho reset chính mình). requireAdmin. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin({ api: true })
    const { id } = await params
    if (id.trim().toLowerCase() === admin.username.trim().toLowerCase()) {
      return NextResponse.json({ error: 'cannot reset self' }, { status: 400 })
    }
    const body = (await request.json().catch(() => ({}))) as { password?: string }
    const newPassword = body.password?.trim() || DEFAULT_RESET_PASSWORD
    const ok = await resetUserPassword(admin.username, id, newPassword)
    if (!ok) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ ok: true, password: newPassword })
  } catch (err) {
    const e = err as { status?: number }
    const status = e?.status ?? 500
    return NextResponse.json({ error: status === 401 ? 'unauthenticated' : 'forbidden' }, { status })
  }
}
