import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { changePassword } from '@/lib/db'
import { log } from '@/lib/logger'

/**
 * POST /api/doi-mat-khau  { oldPassword, newPassword }
 * Auth bắt buộc (middleware gate). Verify mật khẩu cũ rồi ghi hash mới.
 * Tài khoản env-fallback (AUTH_USERS) không có hàng trong DB → 400.
 */
const NEW_RE = /^[^\s]{6,128}$/

export async function POST(request: NextRequest) {
  const username = await currentUser()
  if (!username) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  let body: { oldPassword?: unknown; newPassword?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 })
  }

  const oldPassword = typeof body.oldPassword === 'string' ? body.oldPassword : ''
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

  if (!NEW_RE.test(newPassword)) {
    return NextResponse.json(
      { error: 'Mật khẩu mới phải từ 6 đến 128 ký tự, không chứa khoảng trắng.' },
      { status: 400 },
    )
  }

  try {
    const result = await changePassword(username, oldPassword, newPassword)
    if (result === 'missing') {
      return NextResponse.json(
        { error: 'Tài khoản hệ thống không thể đổi mật khẩu tại đây.' },
        { status: 400 },
      )
    }
    if (result === 'wrong') {
      return NextResponse.json({ error: 'Mật khẩu hiện tại không đúng.' }, { status: 400 })
    }
    log.info('password_changed', { username })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return NextResponse.json(
        { error: 'Chưa cấu hình cơ sở dữ liệu — không thể đổi mật khẩu.' },
        { status: 503 },
      )
    }
    log.error('password_change_failed', { username, error: String(error) })
    return NextResponse.json({ error: 'Không đổi được mật khẩu. Thử lại sau.' }, { status: 500 })
  }
}
