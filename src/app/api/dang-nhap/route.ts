import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/session'
import { findDbAccount } from '@/lib/db'
import { checkRate, hitRate, resetRate, LOGIN_RATE_MAX } from '@/lib/rate-limit'
import { log } from '@/lib/logger'

/**
 * POST /api/dang-nhap  { username, password }
 * Sets a signed httpOnly session cookie on success. JSON in/out for the login form.
 * Accounts live in Postgres (auto-created + seeded on first use); without
 * DATABASE_URL we fall back to AUTH_USERS env pairs.
 */

/** Verify against DB first (when configured), then env fallback. */
async function verifyCredentials(username: string, password: string): Promise<string | null> {
  const dbAccount = await findDbAccount(username)
  if (dbAccount) {
    return dbAccount.verify(password) ? dbAccount.username : null
  }
  // Env fallback: "user:pass,user2:pass2" — default admin/tonyflix when unset.
  const raw = process.env.AUTH_USERS?.trim()
  const pairs = raw && raw.length > 0 ? raw : 'admin:tonyflix'
  for (const pair of pairs.split(',')) {
    const idx = pair.indexOf(':')
    if (idx <= 0) continue
    const user = pair.slice(0, idx).trim()
    const pass = pair.slice(idx + 1)
    if (!user || !pass) continue
    if (user.toLowerCase() === username.trim().toLowerCase() && pass === password) {
      return user
    }
  }
  return null
}

export async function POST(request: NextRequest) {
  let body: { username?: unknown; password?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 })
  }

  const username = typeof body.username === 'string' ? body.username.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!username || !password) {
    return NextResponse.json({ error: 'Nhập tên tài khoản và mật khẩu.' }, { status: 400 })
  }

  const key = `${request.headers.get('x-forwarded-for') ?? 'local'}|${username.toLowerCase()}`
  if (checkRate(key, LOGIN_RATE_MAX)) {
    return NextResponse.json(
      { error: 'Thử quá nhiều lần. Chờ khoảng 15 phút rồi thử lại.' },
      { status: 429 },
    )
  }

  const account = await verifyCredentials(username, password)
  if (!account) {
    hitRate(key)
    log.warn('login_failed', { username })
    return NextResponse.json({ error: 'Tên tài khoản hoặc mật khẩu không đúng.' }, { status: 401 })
  }

  resetRate(key)
  const token = await createSessionToken(account)
  log.info('login_ok', { username: account })
  const response = NextResponse.json({ ok: true, username: account })
  // Behind Railway's TLS proxy, NODE_ENV=production + http between proxy and
  // container — trust x-forwarded-proto instead of the raw connection scheme.
  const proto = request.headers.get('x-forwarded-proto') ?? 'http'
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(proto === 'https'))
  return response
}
