import { sql, eq, and, desc } from 'drizzle-orm'
import { pgTable, text, timestamp, primaryKey } from 'drizzle-orm/pg-core'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { scryptSync, timingSafeEqual, randomBytes } from 'node:crypto'
import { log } from '@/lib/logger'


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
      if (seeded.length > 0) log.info('db_seeded_admin')
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
    log.error('db_lookup_failed', { username, error: String(error) })
    return null
  }
}

// ---------------------------------------------------------------------------
// Favorites + watch progress
// ---------------------------------------------------------------------------

/** Lỗi đặc biệt khi DATABASE_URL chưa cấu hình — route handler đổi thành 503. */
class NoDatabaseError extends Error {
  code = 'NO_DB'
}

/** Client Drizzle cho API cá nhân hóa; throw NO_DB khi chưa cấu hình DATABASE_URL. */
async function getDb(): Promise<PostgresJsDatabase<Record<string, never>>> {
  if (!hasDatabase()) throw new NoDatabaseError('DATABASE_URL is not set')
  const { db } = await getClient()
  return db
}

/**
 * Tạo bảng favorites/watch_progress nếu chưa có. ensureSchema() chỉ chạy khi có
 * DATABASE_URL, còn các API cá nhân hóa cần kiểm tra riêng để trả 503 đẹp thay vì crash.
 * Idempotent, cache theo promise.
 */
let favoritesSchemaReady: Promise<void> | null = null

export function ensureFavoritesSchema(): Promise<void> {
  if (!favoritesSchemaReady) {
    favoritesSchemaReady = (async () => {
      await ensureSchema() // tạo users trước (và xác nhận DB cấu hình)
      const { sql } = await getClient()
      await sql`
        CREATE TABLE IF NOT EXISTS favorites (
          user_id TEXT NOT NULL,
          film_slug TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          PRIMARY KEY (user_id, film_slug)
        )
      `
    })().catch((error) => {
      favoritesSchemaReady = null
      throw error
    })
  }
  return favoritesSchemaReady
}

export interface FavoriteRow {
  filmSlug: string
  createdAt: Date
}

/** Danh sách yêu thích một trang, mới nhất trước. */
export async function listFavoritesPage(
  username: string,
  page: number,
  pageSize: number,
): Promise<{ items: FavoriteRow[]; total: number }> {
  const database = await getDb()
  const offset = (page - 1) * pageSize
  const rows = await database
    .select({ filmSlug: favorites.filmSlug, createdAt: favorites.createdAt })
    .from(favorites)
    .where(eq(favorites.userId, username))
    .orderBy(desc(favorites.createdAt))
    .limit(pageSize)
    .offset(offset)
  const totalRows = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(favorites)
    .where(eq(favorites.userId, username))
  return { items: rows, total: totalRows[0]?.count ?? 0 }
}

/** Thêm yêu thích. Trả false nếu đã tồn tại từ trước. */
export async function addFavorite(username: string, filmSlug: string): Promise<boolean> {
  const database = await getDb()
  try {
    await database.insert(favorites).values({ userId: username, filmSlug })
    return true
  } catch (error) {
    const err = error as { code?: string; cause?: { code?: string } }
    if (err.code === '23505' || err.cause?.code === '23505') return false
    throw error
  }
}

/** Bỏ yêu thích. Idempotent — xoá không tồn tại vẫn ok. */
export async function removeFavorite(username: string, filmSlug: string): Promise<void> {
  const database = await getDb()
  await database
    .delete(favorites)
    .where(and(eq(favorites.userId, username), eq(favorites.filmSlug, filmSlug)))
}

/** Kiểm tra nhanh một phim có trong yêu thích không (cho nút tim ở trang chi tiết). */
export async function isFavorite(username: string, filmSlug: string): Promise<boolean> {
  const database = await getDb()
  const rows = await database
    .select({ filmSlug: favorites.filmSlug })
    .from(favorites)
    .where(and(eq(favorites.userId, username), eq(favorites.filmSlug, filmSlug)))
    .limit(1)
  return rows.length > 0
}

/**
 * Bảo đảm bảng watch_progress tồn tại (idempotent, cache per-process).
 * Tách khỏi ensureSchema để API trả 503 đẹp khi thiếu DATABASE_URL.
 */
let progressSchemaReady: Promise<void> | null = null

export function ensureProgressSchema(): Promise<void> {
  if (!progressSchemaReady) {
    progressSchemaReady = (async () => {
      await ensureSchema()
      const { sql } = await getClient()
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
      progressSchemaReady = null
      throw error
    })
  }
  return progressSchemaReady
}

/** Upsert tiến độ xem: mỗi phim một dòng, mở tập mới thì ghi đè. */
export async function upsertWatchProgress(
  username: string,
  filmSlug: string,
  episode: string,
  serverName: string,
): Promise<void> {
  const database = await getDb()
  await database
    .insert(watchProgress)
    .values({ userId: username, filmSlug, episode, serverName })
    .onConflictDoUpdate({
      target: [watchProgress.userId, watchProgress.filmSlug],
      set: { episode, serverName, updatedAt: new Date() },
    })
}

export interface ProgressRow {
  filmSlug: string
  episode: string
  serverName: string
  updatedAt: Date
}

/** Top N phim đang xem dở của user, mới nhất trước. */
export async function listWatchProgress(username: string, limit = 20): Promise<ProgressRow[]> {
  const database = await getDb()
  return database
    .select({
      filmSlug: watchProgress.filmSlug,
      episode: watchProgress.episode,
      serverName: watchProgress.serverName,
      updatedAt: watchProgress.updatedAt,
    })
    .from(watchProgress)
    .where(eq(watchProgress.userId, username))
    .orderBy(desc(watchProgress.updatedAt))
    .limit(limit)
}

/**
 * Health probe for the database connection. Runs a trivial `SELECT 1` with a
 * 3s cap so it never hangs the health endpoint. Returns 'up' / 'down' /
 * 'unconfigured' (no DATABASE_URL set).
 */
export async function checkDbHealth(): Promise<'up' | 'down' | 'unconfigured'> {
  if (!hasDatabase()) return 'unconfigured'
  try {
    const { sql } = await getClient()
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('db health timeout')), 3000),
    )
    await Promise.race([sql`SELECT 1`, timeout])
    return 'up'
  } catch {
    return 'down'
  }
}
