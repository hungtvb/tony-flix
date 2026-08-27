import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { readSessionToken, SESSION_COOKIE } from './session'
import { findDbAccountAdmin } from './db'

export interface AdminUser {
  /** username */
  username: string
  /** có quyền quản trị hay không */
  isAdmin: boolean
}

/**
 * Người dùng hiện tại kèm quyền admin. Chỉ dùng ở server component / route
 * handler (Node runtime) — file này import `db` (node:crypto) nên KHÔNG được
 * import từ middleware (Edge).
 */
export async function currentAdminUser(): Promise<AdminUser | null> {
  const store = await cookies()
  const payload = await readSessionToken(store.get(SESSION_COOKIE)?.value)
  if (!payload) return null
  const isAdmin = await findDbAccountAdmin(payload.u).catch(() => false)
  return { username: payload.u, isAdmin }
}

/**
 * Đảm bảo đã login VÀ có quyền admin.
 * - Chưa login / không phải admin → redirect `/dang-nhap` (page) hoặc ném
 *   AdminAuthError (API, có status code rõ ràng).
 */
export async function requireAdmin(opts: { api?: boolean } = {}): Promise<AdminUser> {
  const user = await currentAdminUser()
  if (!user) {
    if (opts.api) throw new AdminAuthError('unauthenticated', 401)
    redirect('/dang-nhap')
  }
  if (!user.isAdmin) {
    if (opts.api) throw new AdminAuthError('forbidden', 403)
    redirect('/')
  }
  return user
}

/** Lỗi có status code rõ ràng để route handler bắt và trả JSON. */
export class AdminAuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}
