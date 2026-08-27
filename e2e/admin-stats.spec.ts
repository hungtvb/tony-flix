import { test, expect } from '@playwright/test'

/**
 * API thống kê admin:
 * - Admin gọi → 200 + các trường số (totalUsers, ...)
 * - User thường gọi → 403
 * - Guest gọi → 401
 */

function cookieFrom(res: { headers(): Record<string, string> }): string {
  const c = res.headers()['set-cookie']
  return c ? c.split(';')[0] : ''
}

test.describe('Admin stats API', () => {
  test('guest gọi /api/admin/stats → 401', async ({ request }) => {
    const res = await request.get('/api/admin/stats')
    expect(res.status()).toBe(401)
  })

  test('admin gọi /api/admin/stats → 200 có totalUsers', async ({ request }) => {
    const login = await request.post('/api/dang-nhap', {
      data: { username: process.env.E2E_USER ?? 'admin', password: process.env.E2E_PASS ?? 'tonyflix' },
    })
    expect(login.ok()).toBeTruthy()
    const res = await request.get('/api/admin/stats', {
      headers: { cookie: cookieFrom(login) },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(typeof body.totalUsers).toBe('number')
    expect(typeof body.totalFavorites).toBe('number')
    expect(Array.isArray(body.topFilms)).toBeTruthy()
  })

  test('user thường gọi /api/admin/stats → 403', async ({ request }) => {
    const uname = `stats_${Date.now()}`
    const reg = await request.post('/api/dang-ky', { data: { username: uname, password: 'Passw0rd!' } })
    expect(reg.ok()).toBeTruthy()
    const login = await request.post('/api/dang-nhap', { data: { username: uname, password: 'Passw0rd!' } })
    expect(login.ok()).toBeTruthy()
    const res = await request.get('/api/admin/stats', {
      headers: { cookie: cookieFrom(login) },
    })
    expect(res.status()).toBe(403)
  })
})
