import { test, expect } from '@playwright/test'

/**
 * DB-backed accounts: user tồn tại CHỈ trong Postgres (không nằm trong
 * AUTH_USERS) vẫn đăng nhập được — chứng minh đường DB thật.
 *
 * Yêu cầu: server chạy với DATABASE_URL trỏ tới DB có sẵn user 'dbonly'
 * (script e2e-with-auth.sh seed trước khi chạy).
 */
test.describe('Tài khoản trong DB', () => {
  const DB_USER = process.env.E2E_DB_USER ?? 'dbonly'
  const DB_PASS = process.env.E2E_DB_PASS ?? 'dbpass123'

  test('user chỉ có trong DB đăng nhập thành công', async ({ page }) => {
    await page.goto('/dang-nhap')
    await page.fill('#username', DB_USER)
    await page.fill('#password', DB_PASS)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('button', { name: 'Đăng xuất' })).toBeVisible()
  })

  test('sai mật khẩu của user trong DB bị từ chối', async ({ page }) => {
    await page.goto('/dang-nhap')
    await page.fill('#username', DB_USER)
    await page.fill('#password', 'sai-roi-nhe')
    await page.click('button[type="submit"]')
    await expect(page.locator('p[role="alert"]')).toContainText('không đúng')
  })
})
