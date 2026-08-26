import { NextRequest, NextResponse } from 'next/server'
import { createUserAccount } from '@/lib/db'

/**
 * POST /api/dang-ky  { username, password }
 * Creates a Postgres account (scrypt hash) and logs the user in immediately
 * by setting the signed session cookie. JSON in/out.
 *
 * Requires DATABASE_URL — without a database there is nowhere to store new
 * accounts, so registration returns 503 with a Vietnamese message.
 */

// Username: 3-24 ký tự, chữ/số/gạch dưới, không bắt đầu bằng số.
const USERNAME_RE = /^[a-z_][a-z0-9_]{2,23}$/

export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json(
      { error: 'Chưa cấu hình cơ sở dữ liệu — không thể đăng ký tài khoản mới.' },
      { status: 503 },
    )
  }

  let body: { username?: unknown; password?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 })
  }

  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: 'Tên tài khoản 3-24 ký tự, chỉ chữ thường/số/gạch dưới, không bắt đầu bằng số.' },
      { status: 400 },
    )
  }
  if (password.length < 6 || password.length > 128) {
    return NextResponse.json({ error: 'Mật khẩu phải từ 6 đến 128 ký tự.' }, { status: 400 })
  }

  try {
    const created = await createUserAccount(username, password)
    if (!created) {
      return NextResponse.json(
        { error: 'Tên tài khoản đã tồn tại. Chọn tên khác.' },
        { status: 409 },
      )
    }
  } catch {
    return NextResponse.json({ error: 'Không tạo được tài khoản. Thử lại sau.' }, { status: 500 })
  }

  // Auto-login: reuse the session issuer from the login route.
  const { createSessionToken } = await import('@/lib/session')
  const { SESSION_COOKIE, sessionCookieOptions } = await import('@/lib/session')
  const token = await createSessionToken(username)
  const response = NextResponse.json({ ok: true, username }, { status: 201 })
  const proto = request.headers.get('x-forwarded-proto') ?? 'http'
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(proto === 'https'))
  return response
}
