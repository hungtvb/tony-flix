import { test, expect } from '@playwright/test'

/**
 * Gate phân quyền admin:
 * - Khách (guest) truy cập /admin → redirect /dang-nhap
 * - User thường (không phải admin) truy cập /admin → redirect / (hoặc 403 API)
 * - Admin truy cập /admin/me API → 200 + isAdmin true
 */

test.describe('Admin guard', () => {
  test('guest bị chuyển hướng vào trang đăng nhập khi vào /admin', async ({ page }) => {
    await page.goto('/admin')
    await expect.poll(() => page.url()).toContain('dang-nhap')
  })

  test('guest gọi API /api/admin/me → 401', async ({ request }) => {
    const res = await request.get('/api/admin/me')
    expect(res.status()).toBe(401)
  })

  test('user thường gọi API /api/admin/me → 403', async ({ request }) => {
    // Tạo + login 1 user thường (không admin) rồi gọi API với cookie của nó.
    const uname = `guest_${Date.now()}`
    const reg = await request.post('/api/dang-ky', { data: { username: uname, password: 'Passw0rd!' } })
    expect(reg.ok()).toBeTruthy()
    const login = await request.post('/api/dang-nhap', { data: { username: uname, password: 'Passw0rd!' } })
    expect(login.ok()).toBeTruthy()
    const setCookie = login.headers()['set-cookie']
    expect(setCookie).toBeTruthy()
    const me = await request.get('/api/admin/me', {
      headers: { cookie: setCookie!.split(';')[0] },
    })
    expect(me.status()).toBe(403)
  })
})
