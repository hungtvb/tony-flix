import { NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth'

/** POST /api/thoat — clears the session cookie. */
export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 })
  return response
}
