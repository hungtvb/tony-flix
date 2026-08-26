import { NextResponse } from 'next/server'
import { checkDbHealth } from '@/lib/db'

/**
 * GET /api/health
 * Liveness + DB connectivity probe for Railway healthchecks and uptime
 * monitors. Always returns HTTP 200 when the process is alive — a down DB
 * only flips the `db` flag rather than killing the pod (Railway would
 * otherwise restart a healthy app just because Postgres blipped).
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  const db = await checkDbHealth()
  return NextResponse.json({
    ok: true,
    db,
    uptime: Math.round(process.uptime()),
    time: new Date().toISOString(),
  })
}
