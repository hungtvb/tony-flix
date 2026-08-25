import { NextResponse } from 'next/server'
import { fetchFilm } from '@/lib/nguonc'

export const revalidate = 60

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  try {
    const data = await fetchFilm(slug)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 502 })
  }
}
