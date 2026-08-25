import { NextResponse } from 'next/server'
import { fetchLatestFilms } from '@/lib/nguonc'

export const revalidate = 60

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1)
  try {
    const data = await fetchLatestFilms(page)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 502 })
  }
}
