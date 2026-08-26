import { cookies } from 'next/headers'
import { readSessionToken, SESSION_COOKIE, type SessionCookieOptions } from './session'

export * from './session'

/** Current authenticated username from the request cookies (server side only). */
export async function currentUser(): Promise<string | null> {
  const store = await cookies()
  const payload = await readSessionToken(store.get(SESSION_COOKIE)?.value)
  return payload?.u ?? null
}

export type { SessionCookieOptions }
