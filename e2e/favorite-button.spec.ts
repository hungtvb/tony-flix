import { test, expect } from '@playwright/test'

/**
 * Verify nút tim ở trang chi tiết: toggle optimistic + persist qua reload.
 * Chạy trong project 'guest' — tự đăng ký user mới mỗi lần chạy.
 */
const PASSWORD = 'matkhau-123'
const USERNAME = `heart${Date.now().toString(36)}`

test('nút tim: bấm fill → reload còn → bấm bỏ → reload mất', async ({ page }) => {
  // Đăng ký (auto-login) rồi vào trang chi tiết phim có sẵn
  await page.goto('/dang-ky')
  await page.fill('#username', USERNAME)
  await page.fill('#password', PASSWORD)
  await page.fill('#confirm', PASSWORD)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/$/)

  const cards = page.locator('a[href^="/phim/"]')
  await cards.first().waitFor({ state: 'visible' })
  const detailHref = await cards.nth(1).getAttribute('href')
  await page.goto(detailHref!)

  const heart = page.getByRole('button', { name: /yêu thích/i })
  await expect(heart).toBeVisible()
  await expect(heart).toHaveAttribute('aria-pressed', 'false')

  // Bấm → fill (optimistic, không reload)
  await heart.click()
  await expect(heart).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 })

  // Reload → trạng thái giữ nguyên từ server
  await page.reload()
  const heartAfter = page.getByRole('button', { name: /yêu thích/i })
  await expect(heartAfter).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 })

  // Bấm lần nữa → bỏ
  await heartAfter.click()
  await expect(heartAfter).toHaveAttribute('aria-pressed', 'false', { timeout: 10_000 })

  // Reload xác nhận đã bỏ thật
  await page.reload()
  await expect(page.getByRole('button', { name: /yêu thích/i })).toHaveAttribute(
    'aria-pressed',
    'false',
    { timeout: 10_000 },
  )
})
