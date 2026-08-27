import { NextResponse } from 'next/server'
import { searchFilms } from '@/lib/nguonc'
import { proxyCacheHeaders } from '@/lib/cache'

export const revalidate = 60

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const keyword = (searchParams.get('keyword') ?? '').trim()
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1)
  if (!keyword) return NextResponse.json({ error: 'missing keyword' }, { status: 400 })
  try {
    const data = await searchFilms(keyword, page)
    return NextResponse.json(data, { headers: proxyCacheHeaders(300) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 502 })
  }
}
