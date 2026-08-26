import { test, expect } from '@playwright/test'

/**
 * API tiến độ xem: guest → 401; đăng ký → upsert tập 2 → GET thấy tập 2 →
 * upsert lại tập 5 → GET thấy tập 5 (không nhân bản dòng).
 */
const PASSWORD = 'matkhau-123'
const USERNAME = `prog${Date.now().toString(36)}`
const SLUG = 'e2e-phim-tien-do'

test('khách chưa đăng nhập → 401', async ({ request }) => {
  expect((await request.get('/api/tien-do')).status()).toBe(401)
})

test('đăng ký → upsert → GET đúng tập → upsert đè → không nhân bản', async ({ request }) => {
  const reg = await request.post('/api/dang-ky', {
    data: { username: USERNAME, password: PASSWORD },
  })
  expect(reg.status()).toBe(201)

  // Ghi tiến độ tập 2
  const post1 = await request.post('/api/tien-do', {
    data: { slug: SLUG, episode: 'tap-2', serverName: 'Số 1' },
  })
  expect(post1.status()).toBe(201)

  let list = await request.get('/api/tien-do')
  expect(list.status()).toBe(200)
  let body = await list.json()
  const row = body.items.find((i: { slug: string }) => i.slug === SLUG)
  expect(row).toBeTruthy()
  expect(row.episode).toBe('tap-2')
  expect(row.serverName).toBe('Số 1')

  // Đổi sang tập 5 — cùng slug phải ghi đè chứ không thêm dòng mới
  const post2 = await request.post('/api/tien-do', {
    data: { slug: SLUG, episode: 'tap-5', serverName: 'Số 1' },
  })
  expect(post2.status()).toBe(201)

  list = await request.get('/api/tien-do')
  body = await list.json()
  const sameRows = body.items.filter((i: { slug: string }) => i.slug === SLUG)
  expect(sameRows).toHaveLength(1)
  expect(sameRows[0].episode).toBe('tap-5')
})

test('thiếu dữ liệu → 400', async ({ request }) => {
  await request.post('/api/dang-ky', {
    data: { username: `${USERNAME}x`, password: PASSWORD },
  })
  const res = await request.post('/api/tien-do', { data: { slug: SLUG } })
  expect(res.status()).toBe(400)
})
