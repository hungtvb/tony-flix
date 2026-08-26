import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/session'
import { findDbAccount } from '@/lib/db'

/**
 * POST /api/dang-nhap  { username, password }
 * Sets a signed httpOnly session cookie on success. JSON in/out for the login form.
 * Accounts live in Postgres (auto-created + seeded on first use); without
 * DATABASE_URL we fall back to AUTH_USERS env pairs.
 */

// Naive per-instance rate limit against password brute-force.
const attempts = new Map<string, { count: number; firstAt: number }>()
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 10

function tooManyAttempts(key: string): boolean {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || now - entry.firstAt > WINDOW_MS) return false
  return entry.count >= MAX_ATTEMPTS
}

function recordAttempt(key: string): void {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now })
  } else {
    entry.count += 1
  }
}

function resetAttempts(key: string): void {
  attempts.delete(key)
}

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
  if (tooManyAttempts(key)) {
    return NextResponse.json(
      { error: 'Thử quá nhiều lần. Chờ khoảng 15 phút rồi thử lại.' },
      { status: 429 },
    )
  }

  const account = await verifyCredentials(username, password)
  if (!account) {
    recordAttempt(key)
    return NextResponse.json({ error: 'Tên tài khoản hoặc mật khẩu không đúng.' }, { status: 401 })
  }

  resetAttempts(key)
  const token = await createSessionToken(account)
  const response = NextResponse.json({ ok: true, username: account })
  // Behind Railway's TLS proxy, NODE_ENV=production + http between proxy and
  // container — trust x-forwarded-proto instead of the raw connection scheme.
  const proto = request.headers.get('x-forwarded-proto') ?? 'http'
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(proto === 'https'))
  return response
}
