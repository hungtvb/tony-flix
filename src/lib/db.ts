import { sql, eq, and, desc } from 'drizzle-orm'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { scryptSync, timingSafeEqual, randomBytes } from 'node:crypto'
import { log } from '@/lib/logger'
import { users, favorites, watchProgress, curatedFilms } from '@/lib/schema'


/**
 * TonyFlix database — PostgreSQL + Drizzle ORM (Node runtime only).
 *
 * Set DATABASE_URL (Railway: provision a Postgres service and reference its
 * ${{Postgres.DATABASE_URL}}). Without it the app still runs using env
 * AUTH_USERS accounts — the DB layer simply stays dormant.
 */

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
      // ALTER idempotent: thêm cột is_admin (đã có thì bỏ qua), rồi đảm bảo
      // tài khoản admin luôn có quyền admin. Chạy mỗi lần boot an toàn.
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false`
      await sql`UPDATE users SET is_admin = true WHERE id = 'admin'`
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

// Cache quyền admin theo process để không truy vấn DB mỗi request.
// Key là username đã lowercase; TTL ngắn (10s) đủ tươi mà vẫn nhẹ.
const adminCache = new Map<string, { isAdmin: boolean; ts: number }>()
const ADMIN_CACHE_TTL = 10_000

/**
 * Kiểm tra nhanh một username có quyền admin không.
 * Trả false an toàn khi: không có DB, user không tồn tại, hoặc lỗi.
 * Kết quả cache 10s theo process.
 */
export async function findDbAccountAdmin(username: string): Promise<boolean> {
  if (!hasDatabase()) {
    // Không có DB → chỉ tài khoản env-fallback admin (nếu trùng tên) mới admin.
    return username.trim().toLowerCase() === 'admin'
  }
  const key = username.trim().toLowerCase()
  const cached = adminCache.get(key)
  if (cached && Date.now() - cached.ts < ADMIN_CACHE_TTL) return cached.isAdmin
  try {
    await ensureSchema()
    const { db } = await getClient()
    const rows = await db.execute<{ is_admin: boolean }>(
      sql`SELECT is_admin FROM users WHERE id = ${key} LIMIT 1`,
    )
    const isAdmin = Boolean(rows[0]?.is_admin)
    adminCache.set(key, { isAdmin, ts: Date.now() })
    return isAdmin
  } catch (error) {
    log.error('db_admin_lookup_failed', { username: key, error: String(error) })
    return false
  }
}

/**
 * Đổi mật khẩu tài khoản. Verify mật khẩu cũ trước khi ghi hash mới.
 * Trả 'ok' | 'wrong' | 'missing' (user không tồn tại trong DB).
 */
export async function changePassword(
  username: string,
  oldPassword: string,
  newPassword: string,
): Promise<'ok' | 'wrong' | 'missing'> {
  if (!hasDatabase()) throw new NoDatabaseError('DATABASE_URL is not set')
  await ensureSchema()
  const { db } = await getClient()
  const rows = await db.execute<{ id: string; password_hash: string }>(
    sql`SELECT id, password_hash FROM users WHERE id = ${username.trim().toLowerCase()} LIMIT 1`,
  )
  const row = rows[0]
  if (!row) return 'missing'
  if (!verifyPassword(oldPassword, row.password_hash)) return 'wrong'
  await db
    .update(users)
    .set({ passwordHash: hashPassword(newPassword) })
    .where(eq(users.id, username.trim().toLowerCase()))
  return 'ok'
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

// ---------------------------------------------------------------------------
// Admin statistics
// ---------------------------------------------------------------------------

export interface AdminStats {
  totalUsers: number
  newUsers7d: number
  totalFavorites: number
  totalWatchProgress: number
  topFilms: { filmSlug: string; views: number }[]
  topUsers: { username: string; favorites: number }[]
}

/**
 * Tổng hợp số liệu quản trị. Chỉ gọi từ route admin (đã qua requireAdmin).
 * Mọi truy vấn fail mềm (trả 0 / []) để dashboard không sập khi 1 bảng lỗi.
 */
export async function getAdminStats(): Promise<AdminStats> {
  const database = await getDb()
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const totalUsers = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .then((r) => r[0]?.count ?? 0)

  const newUsers7d = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(sql`${users.createdAt} >= ${since.toISOString()}`)
    .then((r) => r[0]?.count ?? 0)

  const totalFavorites = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(favorites)
    .then((r) => r[0]?.count ?? 0)

  const totalWatchProgress = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(watchProgress)
    .then((r) => r[0]?.count ?? 0)

  const topFilms = await database
    .select({
      filmSlug: watchProgress.filmSlug,
      views: sql<number>`count(*)::int`,
    })
    .from(watchProgress)
    .groupBy(watchProgress.filmSlug)
    .orderBy(desc(sql`count(*)`))
    .limit(10)
    .then((rows) => rows.map((r) => ({ filmSlug: r.filmSlug, views: r.views })))

  const topUsers = await database
    .select({
      username: favorites.userId,
      favorites: sql<number>`count(*)::int`,
    })
    .from(favorites)
    .groupBy(favorites.userId)
    .orderBy(desc(sql`count(*)`))
    .limit(10)
    .then((rows) => rows.map((r) => ({ username: r.username, favorites: r.favorites })))

  return {
    totalUsers,
    newUsers7d,
    totalFavorites,
    totalWatchProgress,
    topFilms,
    topUsers,
  }
}

// ---------------------------------------------------------------------------
// Admin: user management
// ---------------------------------------------------------------------------

export interface AdminUserRow {
  id: string
  isAdmin: boolean
  createdAt: string
}

/** Danh sách user phân trang, tìm kiếm theo id (ILIKE). Mới nhất trước. */
export async function listUsers(opts: {
  page?: number
  pageSize?: number
  search?: string
}): Promise<{ items: AdminUserRow[]; total: number }> {
  const database = await getDb()
  const page = Math.max(1, opts.page ?? 1)
  const pageSize = Math.min(100, opts.pageSize ?? 20)
  const search = opts.search?.trim()
  const where = search ? sql`${users.id} ILIKE ${`%${search}%`}` : undefined

  const items = await database
    .select({
      id: users.id,
      isAdmin: users.isAdmin,
      createdAt: sql<string>`to_char(${users.createdAt}, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
    })
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  const totalRows = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(where)
  return { items: items.map((r) => ({ ...r, createdAt: String(r.createdAt) })), total: totalRows[0]?.count ?? 0 }
}

/** Reset mật khẩu về mặc định. Không cho reset chính mình. Trả false nếu user không tồn tại. */
export async function resetUserPassword(
  adminUsername: string,
  targetId: string,
  newPassword: string,
): Promise<boolean> {
  const database = await getDb()
  const id = targetId.trim().toLowerCase()
  if (id === adminUsername.trim().toLowerCase()) return false
  const res = await database
    .update(users)
    .set({ passwordHash: hashPassword(newPassword) })
    .where(eq(users.id, id))
    .returning({ id: users.id })
  return res.length > 0
}

/** Xoá user + toàn bộ dữ liệu liên quan (favorites, watch_progress). Không cho xoá chính mình. */
export async function deleteUser(adminUsername: string, targetId: string): Promise<boolean> {
  const database = await getDb()
  const id = targetId.trim().toLowerCase()
  if (id === adminUsername.trim().toLowerCase()) return false
  const res = await database.delete(users).where(eq(users.id, id)).returning({ id: users.id })
  const removed = res.length > 0
  if (removed) {
    await database.delete(favorites).where(eq(favorites.userId, id))
    await database.delete(watchProgress).where(eq(watchProgress.userId, id))
  }
  return removed
}

// ---------------------------------------------------------------------------
// Admin: curated films (Editor's picks)
// ---------------------------------------------------------------------------

let curatedSchemaReady: Promise<void> | null = null

export function ensureCuratedSchema(): Promise<void> {
  if (!curatedSchemaReady) {
    curatedSchemaReady = (async () => {
      await ensureSchema()
      const { sql } = await getClient()
      await sql`
        CREATE TABLE IF NOT EXISTS curated_films (
          film_slug TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          poster TEXT NOT NULL DEFAULT '',
          note TEXT NOT NULL DEFAULT '',
          position INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `
    })().catch((error) => {
      curatedSchemaReady = null
      throw error
    })
  }
  return curatedSchemaReady
}

export interface CuratedFilmRow {
  filmSlug: string
  title: string
  poster: string
  note: string
  position: number
}

/** Danh sách phim nổi bật, sắp xếp theo position (nhỏ trước). */
export async function listCuratedFilms(): Promise<CuratedFilmRow[]> {
  const database = await getDb()
  await ensureCuratedSchema()
  return database
    .select({
      filmSlug: curatedFilms.filmSlug,
      title: curatedFilms.title,
      poster: curatedFilms.poster,
      note: curatedFilms.note,
      position: curatedFilms.position,
    })
    .from(curatedFilms)
    .orderBy(curatedFilms.position, curatedFilms.createdAt)
}

/** Thêm / cập nhật phim nổi bật. Trả về row sau upsert. */
export async function upsertCuratedFilm(input: {
  filmSlug: string
  title: string
  poster?: string
  note?: string
  position?: number
}): Promise<CuratedFilmRow> {
  const database = await getDb()
  await ensureCuratedSchema()
  const slug = input.filmSlug.trim()
  const nextPos = await database
    .select({ max: sql<number>`coalesce(max(${curatedFilms.position}), 0)::int` })
    .from(curatedFilms)
    .then((r) => (r[0]?.max ?? 0) + 1)
  const rows = await database
    .insert(curatedFilms)
    .values({
      filmSlug: slug,
      title: input.title,
      poster: input.poster ?? '',
      note: input.note ?? '',
      position: input.position ?? nextPos,
    })
    .onConflictDoUpdate({
      target: curatedFilms.filmSlug,
      set: {
        title: input.title,
        poster: input.poster ?? '',
        note: input.note ?? '',
        position: input.position ?? nextPos,
      },
    })
    .returning({
      filmSlug: curatedFilms.filmSlug,
      title: curatedFilms.title,
      poster: curatedFilms.poster,
      note: curatedFilms.note,
      position: curatedFilms.position,
    })
  return rows[0]
}

/** Xoá phim nổi bật. Trả false nếu không tồn tại. */
export async function removeCuratedFilm(filmSlug: string): Promise<boolean> {
  const database = await getDb()
  await ensureCuratedSchema()
  const res = await database
    .delete(curatedFilms)
    .where(eq(curatedFilms.filmSlug, filmSlug.trim()))
    .returning({ filmSlug: curatedFilms.filmSlug })
  return res.length > 0
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
