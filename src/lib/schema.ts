import { sql } from 'drizzle-orm'
import { pgTable, text, timestamp, boolean, primaryKey } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(), // username, lowercased for lookups
  passwordHash: text('password_hash').notNull(),
  isAdmin: boolean('is_admin').notNull().default(false),
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
