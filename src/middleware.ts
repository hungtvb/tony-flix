import { NextRequest, NextResponse } from 'next/server'
import { readSessionToken, SESSION_COOKIE } from '@/lib/auth'

const PUBLIC_PATHS = [
  '/dang-nhap',
  '/dang-ky',
  '/api/dang-nhap',
  '/api/dang-ky',
  '/api/thoat',
  '/api/health',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.webmanifest',
  '/opengraph-image',
  '/icon.svg',
]

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

/** Attach OWASP-recommended security headers to every response leaving the app. */
function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  // CSP in Report-Only first: lets the player embed (cross-origin iframes)
  // keep working while we observe violations before enforcing.
  response.headers.set(
    'Content-Security-Policy-Report-Only',
    "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; frame-src https:; object-src 'none'; base-uri 'self'",
  )
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  if (isPublic(pathname)) return withSecurityHeaders(NextResponse.next())

  const payload = await readSessionToken(request.cookies.get(SESSION_COOKIE)?.value)
  if (payload) return withSecurityHeaders(NextResponse.next())

  // API → JSON 401; pages → redirect to login with ?next=<original path>
  if (pathname.startsWith('/api/')) {
    return withSecurityHeaders(NextResponse.json({ error: 'unauthenticated' }, { status: 401 }))
  }
  const loginUrl = new URL('/dang-nhap', request.url)
  loginUrl.searchParams.set('next', pathname + search)
  return withSecurityHeaders(NextResponse.redirect(loginUrl))
}

export const config = {
  matcher: [
    /*
     * Guard everything except:
     * - _next/static, _next/image (assets)
     * - favicon.ico, icon files, manifest
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.ico$).*)',
  ],
}
