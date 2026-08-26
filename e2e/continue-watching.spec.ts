import { test, expect } from '@playwright/test'

/**
 * Luồng Tiếp tục xem end-to-end: đăng ký → mở trang xem một tập bất kỳ →
 * về trang chủ thấy hàng "Tiếp tục xem" với đúng phim + badge tập →
 * bấm vào quay đúng tập/server đã xem.
 */
const PASSWORD = 'matkhau-123'
const USERNAME = `cw${Date.now().toString(36)}`

test('tiếp tục xem: ghi tiến độ → home hiện hàng → click quay đúng tập', async ({ page }) => {
  await page.goto('/dang-ky')
  await page.fill('#username', USERNAME)
  await page.fill('#password', PASSWORD)
  await page.fill('#confirm', PASSWORD)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/$/)

  // Tìm một phim có tập để xem (thử tối đa 3 card)
  let watchHref: string | null = null
  for (let i = 1; i <= 3 && !watchHref; i++) {
    await page.goto('/')
    const card = page.locator('a[href^="/phim/"]').nth(i)
    await card.waitFor({ state: 'visible' })
    await page.goto((await card.getAttribute('href'))!)
    const eps = page.locator('a[href^="/xem/"]')
    try {
      await eps.first().waitFor({ state: 'visible', timeout: 8_000 })
      watchHref = await eps.first().getAttribute('href')
    } catch {
      // phim không có tập — thử card khác
    }
  }
  expect(watchHref).toBeTruthy()

  // Mở trang xem và đợi WatchTracker POST tiến độ xong
  // (domcontentloaded: iframe embed upstream hay treo event load trên headless)
  const postDone = page
    .waitForResponse(
      (r) => r.url().includes('/api/tien-do') && r.request().method() === 'POST',
    )
    .catch(() => null)
  await page.goto(watchHref!, { waitUntil: 'domcontentloaded' })
  const posted = await postDone
  expect(posted).toBeTruthy()
  expect(posted!.status()).toBe(201)

  // Về trang chủ: hàng Tiếp tục xem xuất hiện với đúng phim
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Tiếp tục xem' })).toBeVisible({
    timeout: 15_000,
  })
  const target = new URL(watchHref!, 'http://localhost')
  const filmSlug = target.pathname.split('/').pop()!
  const cwCard = page.locator(`a[href^="/xem/${filmSlug}?"]`).first()
  await expect(cwCard).toBeVisible()

  // Bấm card → quay đúng phim + tập đã xem (sv được server resolve tự động)
  await cwCard.click()
  const u = new URL(page.url())
  expect(u.pathname).toBe(`/xem/${filmSlug}`)
  expect(u.searchParams.get('ep')).toBe(target.searchParams.get('ep') ?? 'tap-1')
  expect(u.searchParams.get('sv')).toBeTruthy()
})
