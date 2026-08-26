const BASE = 'https://phim.nguonc.com/api'
// CORS relay fallback khi Cloudflare chặn IP datacenter (đồng bộ với lib/nguonc.ts)
const RELAY = 'https://api.allorigins.win/raw?url='

export const revalidate = 60

const KINDS = ['the-loai', 'quoc-gia', 'nam-phat-hanh'] as const

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const kind = searchParams.get('kind')
  const slug = searchParams.get('slug')

  if (!slug || !KINDS.includes(kind as (typeof KINDS)[number])) {
    return Response.json({ error: 'invalid kind/slug' }, { status: 400 })
  }

  const target = `${BASE}/films/${kind}/${encodeURIComponent(slug)}?page=1`

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(attempt < 3 ? target : `${RELAY}${encodeURIComponent(target)}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      })
      if (res.status === 404) {
        return Response.json({ error: 'not found' }, { status: 404 })
      }
      if (!res.ok) throw new Error(String(res.status))
      return Response.json(await res.json())
    } catch {
      // retry, lần cuối chuyển qua relay
    }
  }
  return Response.json({ error: 'upstream unreachable' }, { status: 502 })
}
