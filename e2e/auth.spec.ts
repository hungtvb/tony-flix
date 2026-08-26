import { test, expect } from '@playwright/test'

/**
 * Auth flow e2e. Server phải chạy với AUTH_USERS/E2E_USER khớp
 * (scripts/e2e-with-auth.sh set sẵn admin:tonyflix).
 *
 * File này chạy trong project 'setup'-independent mode: các test dưới đây tự
 * clear cookies khi cần trạng thái khách (chưa login).
 */

const USER = process.env.E2E_USER ?? 'admin'
const PASS = process.env.E2E_PASS ?? 'tonyflix'

/** Project 'guest' có storageState rỗng — không cần clearCookies thủ công. */
test.describe('Login gate', () => {
  test('khách chưa login vào / bị redirect về /dang-nhap', async ({ page }) => {

    await page.goto('/')
    await expect(page).toHaveURL(/\/dang-nhap/)
    await expect(page.locator('h1')).toContainText('TONYFLIX')
    await expect(page.getByRole('button', { name: /Đăng nhập/ })).toBeVisible()
  })

  test('API không cookie trả 401 JSON', async ({ playwright }) => {
    // Context riêng KHÔNG storageState để mô phỏng khách chưa login
    const guest = await playwright.request.newContext()
    try {
      const res = await guest.get('/api/latest?page=1')
      expect(res.status()).toBe(401)
      expect(await res.json()).toMatchObject({ error: 'unauthenticated' })
    } finally {
      await guest.dispose()
    }
  })

  test('sai mật khẩu hiện lỗi tiếng Việt, không có phiên', async ({ page }) => {

    await page.goto('/dang-nhap')
    await page.fill('#username', USER)
    await page.fill('#password', 'sai-mat-khau-rat-dai')
    await page.click('button[type="submit"]')
    // p[role=alert] của form (Next có sẵn div#__next-route-announcer cũng role=alert)
    await expect(page.locator('p[role="alert"]')).toContainText('không đúng')
    await expect(page).toHaveURL(/dang-nhap/)
  })

  test('đăng nhập đúng → vào trang chủ, thấy user + phim', async ({ page }) => {

    await page.goto('/dang-nhap')
    await page.fill('#username', USER)
    await page.fill('#password', PASS)
    await page.click('button[type="submit"]')

    // Về trang chủ sau login (next mặc định '/')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('button', { name: 'Đăng xuất' })).toBeVisible()

    // Nội dung thật hiển thị sau cổng
    const cards = page.locator('a[href^="/phim/"]')
    await expect(cards.first()).toBeVisible({ timeout: 20_000 })
  })

  test('đăng xuất xong quay lại bị chặn', async ({ page }) => {
    // Login trước bằng form
    await page.goto('/dang-nhap')
    await page.fill('#username', USER)
    await page.fill('#password', PASS)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/$/)

    await page.getByRole('button', { name: 'Đăng xuất' }).click()
    await expect(page).toHaveURL(/\/dang-nhap/)
    await page.goto('/')
    await expect(page).toHaveURL(/\/dang-nhap/)
  })

  test('login từ trang gốc ?next= đưa đúng về trang đó', async ({ page }) => {

    await page.goto('/moi-cap-nhat')
    await expect(page).toHaveURL(/\/dang-nhap.*next=/)
    await page.fill('#username', USER)
    await page.fill('#password', PASS)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/moi-cap-nhat/)
    await expect(page.locator('h1')).toContainText('Mới cập nhật')
  })
})
