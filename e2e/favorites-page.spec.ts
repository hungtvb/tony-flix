import { test, expect } from '@playwright/test'

/**
 * Trang /yeu-thich: empty-state cho user mới → thêm tim ở trang chi tiết →
 * quay lại thấy card. Chạy trong project 'guest', username mới mỗi lần chạy.
 */
const PASSWORD = 'matkhau-123'
const USERNAME = `page${Date.now().toString(36)}`

test('trang yêu thích: rỗng → thêm tim → hiện card', async ({ page }) => {
  await page.goto('/dang-ky')
  await page.fill('#username', USERNAME)
  await page.fill('#password', PASSWORD)
  await page.fill('#confirm', PASSWORD)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/$/)

  // Empty state ban đầu
  await page.goto('/yeu-thich')
  await expect(page.getByRole('heading', { name: 'Yêu thích' })).toBeVisible()
  await expect(page.getByText('Chưa có phim yêu thích')).toBeVisible()

  // Thêm 1 phim qua nút tim
  const cards = page.locator('a[href^="/phim/"]')
  await page.goto('/')
  await cards.first().waitFor({ state: 'visible' })
  const detailHref = await cards.nth(1).getAttribute('href')
  await page.goto(detailHref!)
  const heart = page.getByRole('button', { name: /yêu thích/i })
  await heart.click()
  await expect(heart).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 })

  // Trang yêu thích giờ có card của đúng phim đó
  await page.goto('/yeu-thich')
  const favLink = page.locator(`a[href="${detailHref}"]`)
  await expect(favLink.first()).toBeVisible({ timeout: 15_000 })

  // Navbar có link Yêu thích
  await expect(page.locator('header').getByRole('link', { name: 'Yêu thích' })).toBeVisible()
})
