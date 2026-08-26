import { test, expect } from '@playwright/test'

/**
 * Favorites API e2e — chạy trong project 'guest' (chưa login sẵn).
 * Mỗi lần chạy tự đăng ký username mới nên chạy lại được nhiều lần.
 * Cần server chạy với DATABASE_URL để đăng ký + lưu yêu thích hoạt động.
 */
const PASSWORD = 'matkhau-123'
const USERNAME = `fav${Date.now().toString(36)}`
const SLUG = `e2e-phim-yeu-thich-${Date.now().toString(36)}`

test.describe('API yêu thích', () => {
  test('khách chưa đăng nhập → 401', async ({ request }) => {
    const res = await request.get('/api/yeu-thich')
    expect(res.status()).toBe(401)
  })

  test('đăng ký → thêm → trùng → liệt kê → xoá → rỗng', async ({ request }) => {
    // Đăng ký + auto-login: cookie nằm trong context của fixture `request`
    const reg = await request.post('/api/dang-ky', {
      data: { username: USERNAME, password: PASSWORD },
    })
    expect(reg.status()).toBe(201)

    // Thêm yêu thích
    const add = await request.post('/api/yeu-thich', { data: { slug: SLUG } })
    expect(add.status()).toBe(201)
    expect((await add.json())).toMatchObject({ ok: true })

    // Trùng → vẫn ok nhưng báo already
    const dup = await request.post('/api/yeu-thich', { data: { slug: SLUG } })
    expect(dup.status()).toBe(200)
    expect((await dup.json())).toMatchObject({ already: true })

    // Liệt kê có đúng slug
    const list = await request.get('/api/yeu-thich')
    expect(list.status()).toBe(200)
    const body = await list.json()
    expect(body.items.map((i: { slug: string }) => i.slug)).toContain(SLUG)
    expect(body.total).toBeGreaterThanOrEqual(1)

    // Xoá
    const del = await request.delete('/api/yeu-thich', { data: { slug: SLUG } })
    expect(del.status()).toBe(200)

    // Rỗng lại
    const after = await request.get('/api/yeu-thich')
    const bodyAfter = await after.json()
    expect(bodyAfter.items.map((i: { slug: string }) => i.slug)).not.toContain(SLUG)
  })

  test('thiếu slug → 400', async ({ request }) => {
    await request.post('/api/dang-ky', {
      data: { username: `${USERNAME}b`, password: PASSWORD },
    })
    const res = await request.post('/api/yeu-thich', { data: {} })
    expect(res.status()).toBe(400)
    expect((await res.json()).error).toBeTruthy()
  })
})
