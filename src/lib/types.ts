/** NguonC API types (verified against phim.nguonc.com 25/08). */

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
