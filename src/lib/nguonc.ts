import type { FilmDetailResponse, FilmListResponse } from './types'

const BASE = 'https://phim.nguonc.com/api'
// CORS relay used when Cloudflare blocks the calling datacenter's IP range
// (Vercel build/runtime IPs get intermittent 403s from NguonC).
const RELAY = 'https://api.allorigins.win/raw?url='
const revalidateSeconds = 60
const TIMEOUT_MS = 10_000

function browserHeaders(): HeadersInit {
  return {
    Accept: 'application/json',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
  }
}

async function fetchJson<T>(url: string, viaRelay: boolean): Promise<T> {
  const target = viaRelay ? `${RELAY}${encodeURIComponent(url)}` : url
  const res = await fetch(target, {
    next: { revalidate: revalidateSeconds },
    headers: browserHeaders(),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`NguonC ${res.status}${viaRelay ? ' (relay)' : ''}: ${url}`)
  return (await res.json()) as T
}

async function getJson<T>(url: string): Promise<T> {
  // Upstream sits behind Cloudflare which intermittently 403s datacenter IPs
  // (e.g. Vercel builders). Try direct with short backoff; on persistent
  // failure fall back to a public CORS relay whose egress IPs are not blocked.
  let lastError: unknown = new Error(`NguonC unreachable: ${url}`)
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 700 * attempt))
    try {
      return await fetchJson<T>(url, false)
    } catch (error) {
      lastError = error
    }
  }
  try {
    return await fetchJson<T>(url, true)
  } catch (error) {
    lastError = error
  }
  throw lastError
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
