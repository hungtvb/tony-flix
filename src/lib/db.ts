import { sql } from 'drizzle-orm'
import { pgTable, text, timestamp, primaryKey } from 'drizzle-orm/pg-core'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { scryptSync, timingSafeEqual, randomBytes } from 'node:crypto'


/**
 * TonyFlix database — PostgreSQL + Drizzle ORM (Node runtime only).
 *
 * Set DATABASE_URL (Railway: provision a Postgres service and reference its
 * ${{Postgres.DATABASE_URL}}). Without it the app still runs using env
 * AUTH_USERS accounts — the DB layer simply stays dormant.
 */

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const users = pgTable('users', {
  id: text('id').primaryKey(), // username, lowercased for lookups
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type User = typeof users.$inferSelect

/** Phim user đã bấm yêu thích. PK composite (user_id, film_slug). */
export const favorites = pgTable(
  'favorites',
  {
    userId: text('user_id').notNull(),
    filmSlug: text('film_slug').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.filmSlug] })],
)

export type Favorite = typeof favorites.$inferSelect

/**
 * Tiến độ xem theo CẤP TẬP (player là iframe cross-origin nên không đọc được
 * vị trí phút bên trong). PK composite (user_id, film_slug) — mỗi phim một
 * dòng, upsert cập nhật tập/server mới nhất.
 */
export const watchProgress = pgTable(
  'watch_progress',
  {
    userId: text('user_id').notNull(),
    filmSlug: text('film_slug').notNull(),
    /** Slug tập đang xem dở, ví dụ 'tap-5' hoặc 'full-1'. */
    episode: text('episode').notNull(),
    /** Tên server embed đã chọn, ví dụ 'Số 1'. */
    serverName: text('server_name').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.filmSlug] })],
)

export type WatchProgress = typeof watchProgress.$inferSelect

// ---------------------------------------------------------------------------
// Password hashing (scrypt, Node crypto)
// ---------------------------------------------------------------------------

/** Format: scrypt$<saltHex>$<hashHex> */
export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, 64)
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false
  try {
    const salt = Buffer.from(parts[1], 'hex')
    const expected = Buffer.from(parts[2], 'hex')
    const given = scryptSync(password, salt, expected.length)
    return timingSafeEqual(given, expected)
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Client (lazy singleton)
// ---------------------------------------------------------------------------

let client: postgres.Sql | null = null
let db: PostgresJsDatabase<Record<string, never>> | null = null
let schemaReady: Promise<void> | null = null

function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim())
}

async function getClient(): Promise<{ sql: postgres.Sql; db: PostgresJsDatabase<Record<string, never>> }> {
  if (!db || !client) {
    client = postgres(process.env.DATABASE_URL!, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 8,
      // Railway/managed PGs often require SSL but present self-signed certs.
      ssl: process.env.PGSSL_DISABLE === '1' ? false : 'require',
    })
    db = drizzle(client)
  }
  return { sql: client, db }
}

/**
 * Create tables + seed default admin on first use. Idempotent and cached per
 * process. Uses IF NOT EXISTS so repeated boots are cheap no-ops.
 */
async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const { sql } = await getClient()
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `
      const seeded = await sql`
        INSERT INTO users (id, password_hash)
        VALUES ('admin', ${hashPassword('tonyflix')})
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `
      if (seeded.length > 0) console.log('[db] seeded default admin account')
      await sql`
        CREATE TABLE IF NOT EXISTS favorites (
          user_id TEXT NOT NULL,
          film_slug TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          PRIMARY KEY (user_id, film_slug)
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS watch_progress (
          user_id TEXT NOT NULL,
          film_slug TEXT NOT NULL,
          episode TEXT NOT NULL,
          server_name TEXT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          PRIMARY KEY (user_id, film_slug)
        )
      `
    })().catch((error) => {
      schemaReady = null // allow retry on next request after a transient failure
      throw error
    })
  }
  return schemaReady
}

// ---------------------------------------------------------------------------
// Account creation (registration)
// ---------------------------------------------------------------------------

/**
 * Create a new account. Returns the username on success, null when the name
 * is already taken. Throws on DB failure.
 */
export async function createUserAccount(username: string, password: string): Promise<string | null> {
  if (!hasDatabase()) return null
  await ensureSchema()
  const { db } = await getClient()
  const id = username.trim().toLowerCase()
  try {
    await db.insert(users).values({ id, passwordHash: hashPassword(password) })
    return id
  } catch (error) {
    // Postgres unique_violation = username already registered. Newer drizzle
    // wraps driver errors, so check both the error and its cause chain.
    const err = error as { code?: string; cause?: { code?: string } }
    if (err.code === '23505' || err.cause?.code === '23505') return null
    throw error
  }
}

// ---------------------------------------------------------------------------
// Credential lookup
// ---------------------------------------------------------------------------

export interface DbAccount {
  username: string
  verify(password: string): boolean
}

/** Look up an account in Postgres. Returns null when DB is not configured or user missing. */
export async function findDbAccount(username: string): Promise<DbAccount | null> {
  if (!hasDatabase()) return null
  try {
    await ensureSchema()
    const { db } = await getClient()
    const rows = await db.execute<{ id: string; password_hash: string }>(
      sql`SELECT id, password_hash FROM users WHERE id = ${username.trim().toLowerCase()} LIMIT 1`,
    )
    const row = rows[0]
    if (!row) return null
    return {
      username: row.id,
      verify(password: string) {
        return verifyPassword(password, row.password_hash)
      },
    }
  } catch (error) {
    console.error('[db] lookup failed:', error)
    return null
  }
}
