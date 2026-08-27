import { test, expect } from '@playwright/test'

/**
 * Search từ navbar (desktop) — input thường luôn hiển thị.
 * File riêng để project 'mobile' (Pixel 7, viewport < 640px) bỏ qua,
 * vì mobile navbar thu gọn search thành icon toggle (xem app.spec.ts).
 */
test.describe('Tìm kiếm (desktop)', () => {
  test('search từ navbar (desktop) trả kết quả', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await expect(page.locator('input[name="keyword"]')).toBeVisible()
    await page.fill('input[name="keyword"]', 'người nhện')
    await page.press('input[name="keyword"]', 'Enter')

    await expect(page).toHaveURL(/tim-kiem/)
    await expect(page.locator('h1')).toContainText('Kết quả cho')
  })
})
