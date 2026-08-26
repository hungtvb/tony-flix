import { cookies } from 'next/headers'

/**
 * TonyFlix auth — signed-cookie sessions, no database.
 *
 * - Accounts come from env `AUTH_USERS` ("user:pass,user2:pass2").
 *   Unset → single default account admin/tonyflix (change in production!).
 * - Sessions are HMAC-SHA256-signed tokens stored in an httpOnly cookie.
 * - Uses Web Crypto (crypto.subtle) exclusively so the same helpers run in
 *   both Edge middleware and Node route handlers.
 */

export const SESSION_COOKIE = 'tf_session'
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60 // 30 days

export interface SessionPayload {
  /** username */
  u: string
  /** expiry, unix seconds */
  exp: number
}

function getSecretKeyMaterial(): string {
  return (
    process.env.AUTH_SECRET ||
    // Deterministic dev fallback — always override with AUTH_SECRET in production.
    'tonyflix-dev-secret-do-not-use-in-prod'
  )
}

export interface Account {
  username: string
  password: string
}

/** Parse AUTH_USERS into accounts. Empty/invalid entries are skipped. */
export function listAccounts(): Account[] {
  const raw = process.env.AUTH_USERS?.trim()
  if (!raw) return [{ username: 'admin', password: 'tonyflix' }]
  const accounts: Account[] = []
  for (const pair of raw.split(',')) {
    const idx = pair.indexOf(':')
    if (idx <= 0) continue
    const username = pair.slice(0, idx).trim()
    const password = pair.slice(idx + 1)
    if (!username || !password) continue
    accounts.push({ username, password })
  }
  return accounts.length > 0 ? accounts : [{ username: 'admin', password: 'tonyflix' }]
}

export function findAccount(username: string): Account | undefined {
  const needle = username.trim().toLowerCase()
  return listAccounts().find((a) => a.username.toLowerCase() === needle)
}

// ---------------------------------------------------------------------------
// Primitives (Web Crypto only — works on Edge + Node runtimes)
// ---------------------------------------------------------------------------

function bytesToHex(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0')
  return out
}

async function hmacHex(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecretKeyMaterial()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return bytesToHex(new Uint8Array(sig))
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return bytesToHex(new Uint8Array(digest))
}

/** Length-independent constant-time string comparison. */
function safeEqual(a: string, b: string): boolean {
  const max = Math.max(a.length, b.length)
  let diff = a.length ^ b.length
  for (let i = 0; i < max; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
  }
  return diff === 0
}

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

/** Verify a login attempt. Hashes both sides so plaintext never lingers in JS strings comparisons. */
export async function verifyCredentials(username: string, password: string): Promise<Account | null> {
  const account = findAccount(username)
  if (!account) {
    // Burn equivalent time to avoid trivially probing valid usernames.
    await sha256Hex(password)
    return null
  }
  const [givenHash, expectedHash] = await Promise.all([
    sha256Hex(password),
    sha256Hex(account.password),
  ])
  if (!safeEqual(givenHash, expectedHash)) return null
  return account
}

// ---------------------------------------------------------------------------
// Session tokens
// ---------------------------------------------------------------------------

function base64UrlEncode(json: string): string {
  const bytes = new TextEncoder().encode(json)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(token: string): string | null {
  try {
    const padded = token.replace(/-/g, '+').replace(/_/g, '/')
    const bin = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

/** Create a signed session token for the given username. */
export async function createSessionToken(username: string): Promise<string> {
  const payload: SessionPayload = {
    u: username,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }
  const body = base64UrlEncode(JSON.stringify(payload))
  const sig = await hmacHex(body)
  return `${body}.${sig}`
}

/** Verify a session token. Returns the payload or null when invalid/expired. */
export async function readSessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return null
  const body = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = await hmacHex(body)
  if (!safeEqual(sig, expected)) return null
  const raw = base64UrlDecode(body)
  if (!raw) return null
  let payload: SessionPayload
  try {
    payload = JSON.parse(raw) as SessionPayload
  } catch {
    return null
  }
  if (typeof payload.u !== 'string' || typeof payload.exp !== 'number') return null
  if (payload.exp * 1000 <= Date.now()) return null
  return payload
}

// ---------------------------------------------------------------------------
// Cookie helpers (route handlers / server components)
// ---------------------------------------------------------------------------

export interface SessionCookieOptions {
  maxAge: number
  path: string
  httpOnly: true
  sameSite: 'lax'
  secure: boolean
}

export function sessionCookieOptions(secure?: boolean): SessionCookieOptions {
  return {
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    // Only mark Secure when actually served over HTTPS — a Secure cookie is
    // silently dropped on plain http:// (breaks local/e2e runs).
    secure: secure ?? process.env.NODE_ENV === 'production',
  }
}

/** Current authenticated username from the request cookies (server side only). */
export async function currentUser(): Promise<string | null> {
  const store = await cookies()
  const payload = await readSessionToken(store.get(SESSION_COOKIE)?.value)
  return payload?.u ?? null
}
