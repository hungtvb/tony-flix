import type { FilmDetailResponse, FilmListResponse } from './types'

const BASE = 'https://phim.nguonc.com/api'
const revalidateSeconds = 60

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    next: { revalidate: revalidateSeconds },
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`NguonC ${res.status}: ${url}`)
  return (await res.json()) as T
}

/** Latest films — /api/films/phim-moi-cap-nhat?page=N */
export function fetchLatestFilms(page = 1): Promise<FilmListResponse> {
  return getJson<FilmListResponse>(`${BASE}/films/phim-moi-cap-nhat?page=${page}`)
}

/** Keyword search — /api/films/search?keyword=...&page=N */
export function searchFilms(keyword: string, page = 1): Promise<FilmListResponse> {
  return getJson<FilmListResponse>(`${BASE}/films/search?keyword=${encodeURIComponent(keyword)}&page=${page}`)
}

/** Film detail with episodes — /api/film/{slug} */
export function fetchFilm(slug: string): Promise<FilmDetailResponse> {
  return getJson<FilmDetailResponse>(`${BASE}/film/${encodeURIComponent(slug)}`)
}
