/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Per-instance only (state lives in the Node process) — fine for a single
 * Railway instance. Documented in the README runbook; swap for Redis if we
 * ever run multiple replicas.
 *
 * Thresholds are env-overridable so e2e/CI can widen them without hitting 429.
 */

interface Bucket {
  count: number
  firstAt: number
}

const buckets = new Map<string, Bucket>()

function windowMs(): number {
  const ms = Number(process.env.RATE_LIMIT_WINDOW_MS)
  return Number.isFinite(ms) && ms > 0 ? ms : 15 * 60 * 1000
}

function maxAttempts(defaultMax: number): number {
  const override = defaultMax === LOGIN_MAX_DEFAULT ? process.env.RATE_LIMIT_MAX : undefined
  const ms = Number(override)
  return Number.isFinite(ms) && ms > 0 ? ms : defaultMax
}

const LOGIN_MAX_DEFAULT = 10

/** Default cap for the registration limiter (env: REGISTER_RATE_LIMIT_MAX). */
const REGISTER_MAX_DEFAULT = 5

/** Returns true when `key` has exceeded its limit within the window. */
export function checkRate(key: string, max = LOGIN_MAX_DEFAULT): boolean {
  const entry = buckets.get(key)
  const now = Date.now()
  if (!entry || now - entry.firstAt > windowMs()) return false
  return entry.count >= maxAttempts(max)
}

/** Records one attempt for `key`, starting a fresh window if the old one expired. */
export function hitRate(key: string): void {
  const now = Date.now()
  const entry = buckets.get(key)
  if (!entry || now - entry.firstAt > windowMs()) {
    buckets.set(key, { count: 1, firstAt: now })
  } else {
    entry.count += 1
  }
}

/** Clears the bucket for `key` (call on success so good logins don't count). */
export function resetRate(key: string): void {
  buckets.delete(key)
}

/** Convenience: default login limiter cap (exposed for callers that branch on it). */
export const LOGIN_RATE_MAX = LOGIN_MAX_DEFAULT
/** Convenience: default registration limiter cap. */
export const REGISTER_RATE_MAX = REGISTER_MAX_DEFAULT
