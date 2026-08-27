import { test, expect } from '@playwright/test'

/**
 * Quản lý user (admin):
 * - Admin list user → 200 có items
 * - Admin reset pass user thường → 200, user đăng nhập pass mới OK
 * - Admin xoá user thường → 200, user biến khỏi list
 * - User thường gọi → 403
 */

function cookieFrom(res: { headers(): Record<string, string> }): string {
  const c = res.headers()['set-cookie']
  return c ? c.split(';')[0] : ''
}

test.describe('Admin user management', () => {
  test('admin list user → 200 có items', async ({ request }) => {
    const login = await request.post('/api/dang-nhap', {
      data: { username: process.env.E2E_USER ?? 'admin', password: process.env.E2E_PASS ?? 'tonyflix' },
    })
    const res = await request.get('/api/admin/users', { headers: { cookie: cookieFrom(login) } })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.items)).toBeTruthy()
    expect(typeof body.total).toBe('number')
  })

  test('admin reset + xoá user thường', async ({ request }) => {
    const admin = await request.post('/api/dang-nhap', {
      data: { username: process.env.E2E_USER ?? 'admin', password: process.env.E2E_PASS ?? 'tonyflix' },
    })
    const ac = cookieFrom(admin)
    const uname = `mgr_${Date.now()}`
    const reg = await request.post('/api/dang-ky', { data: { username: uname, password: 'Passw0rd!' } })
    expect(reg.ok()).toBeTruthy()

    // reset về mật khẩu mới
    const reset = await request.put(`/api/admin/users/${uname}`, {
      headers: { cookie: ac },
      data: { password: 'Reset123!' },
    })
    expect(reset.status()).toBe(200)
    // đăng nhập bằng pass mới phải OK
    const relogin = await request.post('/api/dang-nhap', { data: { username: uname, password: 'Reset123!' } })
    expect(relogin.ok()).toBeTruthy()

    // xoá user
    const del = await request.delete(`/api/admin/users/${uname}`, { headers: { cookie: ac } })
    expect(del.status()).toBe(200)
    // list không còn user này
    const list = await request.get('/api/admin/users?search=' + uname, { headers: { cookie: ac } })
    const body = await list.json()
    expect(body.items.find((u: { id: string }) => u.id === uname)).toBeFalsy()
  })

  test('user thường gọi list users → 403', async ({ request }) => {
    const uname = `forb_${Date.now()}`
    await request.post('/api/dang-ky', { data: { username: uname, password: 'Passw0rd!' } })
    const login = await request.post('/api/dang-nhap', { data: { username: uname, password: 'Passw0rd!' } })
    const res = await request.get('/api/admin/users', { headers: { cookie: cookieFrom(login) } })
    expect(res.status()).toBe(403)
  })
})
