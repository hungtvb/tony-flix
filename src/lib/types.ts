/** NguonC API types (verified against phim.nguonc.com 25/08). */

/**
 * QUY ƯỚC NguonC (verified 26/08 — đo kích thước ảnh thật):
 *   poster_url = ảnh NGANG (backdrop 16:9, VD 3840×2160) → dùng cho banner/hero
 *   thumb_url  = ảnh DỌC (poster 2:3,   VD 300×450)     → dùng cho card poster
 * Tên field ngược trực giác — đừng đổi lại!
 */
export interface FilmListItem {
  name: string
  slug: string
  original_name: string
  thumb_url: string
  poster_url: string
  created: string
  modified: string
  description: string
  total_episodes: number
  current_episode: string
  time: string
  quality: string
  language: string
  director: string | null
  casts: string
  year: number
}

export interface Paginate {
  current_page: number
  total_page: number
  total_items: number
  items_per_page: number
}

export interface FilmListResponse {
  status: 'success' | string
  paginate: Paginate
  items: FilmListItem[]
}

export interface EpisodeItem {
  name: string
  slug: string
  embed: string
}

export interface EpisodeServer {
  server_name: string
  items: EpisodeItem[]
}

export interface CategoryGroup {
  group: { id: string; name: string }
  list: { id: string; name: string }[]
}

export interface FilmDetail {
  id: string
  name: string
  slug: string
  original_name: string
  thumb_url: string
  poster_url: string
  created: string
  modified: string
  description: string
  total_episodes: number
  current_episode: string
  time: string
  quality: string
  language: string
  director: string | null
  casts: string
  category: Record<string, CategoryGroup>
  episodes: EpisodeServer[]
}

export interface FilmDetailResponse {
  status: 'success' | string
  movie: FilmDetail
}
