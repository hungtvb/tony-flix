import type { FilmDetailResponse, FilmListResponse } from './types'

const BASE = 'https://phim.nguonc.com/api'
// CORS relay used when Cloudflare blocks the calling datacenter's IP range
// (build/runtime IPs get intermittent 403s from NguonC).
const RELAY = 'https://api.allorigins.win/raw?url='
const revalidateSeconds = 60
const TIMEOUT_MS = 10_000

/** Definitive "this resource does not exist" signal from upstream. */
export class UpstreamNotFound extends Error {}

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
  if (!res.ok) {
    // A plain 404 from upstream means the slug truly does not exist —
    // do not retry, do not relay. Surface as not-found immediately.
    if (res.status === 404 && !viaRelay) throw new UpstreamNotFound(url)
    throw new Error(`NguonC ${res.status}${viaRelay ? ' (relay)' : ''}: ${url}`)
  }
  return (await res.json()) as T
}

async function getJson<T>(url: string): Promise<T> {
  // Upstream sits behind Cloudflare which intermittently 403s datacenter IPs.
  // Try direct with short backoff; on persistent failure fall back to a public
  // CORS relay whose egress IPs are not blocked. 404s abort instantly.
  let lastError: unknown = new Error(`NguonC unreachable: ${url}`)
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 700 * attempt))
      try {
        return await fetchJson<T>(url, false)
      } catch (error) {
        if (error instanceof UpstreamNotFound) throw error
        lastError = error
      }
    }
    return await fetchJson<T>(url, true)
  } catch (error) {
    if (error instanceof UpstreamNotFound) throw error
    lastError = error
  }
  throw lastError
}

/** Latest films — /api/films/phim-moi-cap-nhat?page=N */
export async function fetchLatestFilms(page = 1): Promise<FilmListResponse> {
  const data = await getJson<FilmListResponse>(`${BASE}/films/phim-moi-cap-nhat?page=${page}`)
  if (!data || !Array.isArray(data.items)) throw new Error('NguonC: malformed latest response')
  return data
}

/** Keyword search — /api/films/search?keyword=...&page=N */
export async function searchFilms(keyword: string, page = 1): Promise<FilmListResponse> {
  const data = await getJson<FilmListResponse>(
    `${BASE}/films/search?keyword=${encodeURIComponent(keyword)}&page=${page}`,
  )
  if (!data || !Array.isArray(data.items)) throw new Error('NguonC: malformed search response')
  return data
}

/** Film detail with episodes — /api/film/{slug}. Throws UpstreamNotFound for unknown slugs. */
export async function fetchFilm(slug: string): Promise<FilmDetailResponse> {
  let data: FilmDetailResponse
  try {
    data = await getJson<FilmDetailResponse>(`${BASE}/film/${encodeURIComponent(slug)}`)
  } catch (error) {
    if (error instanceof UpstreamNotFound) throw error
    // Relayed responses lose the original status code — detect the API's own
    // error payload ({"status":"error"}) and surface it as not-found too.
    if (error instanceof SyntaxError) throw new UpstreamNotFound(slug)
    throw error
  }
  if (!data || data.status !== 'success' || !data.movie) {
    throw new UpstreamNotFound(slug)
  }
  return data
}
