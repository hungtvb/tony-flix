import { NextRequest, NextResponse } from 'next/server'
import { readSessionToken, SESSION_COOKIE } from '@/lib/auth'

const PUBLIC_PATHS = ['/dang-nhap', '/dang-ky', '/api/dang-nhap', '/api/dang-ky', '/api/thoat']

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  if (isPublic(pathname)) return NextResponse.next()

  const payload = await readSessionToken(request.cookies.get(SESSION_COOKIE)?.value)
  if (payload) return NextResponse.next()

  // API → JSON 401; pages → redirect to login with ?next=<original path>
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const loginUrl = new URL('/dang-nhap', request.url)
  loginUrl.searchParams.set('next', pathname + search)
  return NextResponse.redirect(loginUrl)
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
