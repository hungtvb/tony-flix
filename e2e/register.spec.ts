import { test, expect } from '@playwright/test'

/**
 * Registration flow e2e — chạy trong project 'guest' (chưa login).
 * Server phải chạy với DATABASE_URL (Postgres) để đăng ký hoạt động.
 *
 * Username duy nhất mỗi lần chạy để test có thể chạy lại (retries/CI).
 */
const USERNAME = `user${Date.now().toString(36)}`
const PASSWORD = 'matkhau-123'

test.describe('Đăng ký tài khoản', () => {
  test('đăng ký thành công → tự đăng nhập, vào trang chủ', async ({ page }) => {
    await page.goto('/dang-ky')
    await expect(page.locator('h1')).toContainText('TONYFLIX')
    await page.fill('#username', USERNAME)
    await page.fill('#password', PASSWORD)
    await page.fill('#confirm', PASSWORD)
    await page.click('button[type="submit"]')

    // Auto-login: về trang chủ với phiên mới
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('button', { name: 'Đăng xuất' })).toBeVisible()

    // Tài khoản mới login lại được sau khi logout
    await page.getByRole('button', { name: 'Đăng xuất' }).click()
    await expect(page).toHaveURL(/\/dang-nhap/)
    await page.fill('#username', USERNAME)
    await page.fill('#password', PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/$/)
  })

  test('trùng tên tài khoản → lỗi 409 tiếng Việt', async ({ page }) => {
    await page.goto('/dang-ky')
    await page.fill('#username', 'admin') // đã tồn tại (seed mặc định)
    await page.fill('#password', PASSWORD)
    await page.fill('#confirm', PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page.locator('p[role="alert"]')).toContainText('đã tồn tại')
  })

  test('mật khẩu nhập lại không khớp → chặn ở client', async ({ page }) => {
    await page.goto('/dang-ky')
    await page.fill('#username', `${USERNAME}x`)
    await page.fill('#password', PASSWORD)
    await page.fill('#confirm', 'khac-roat-ca')
    await page.click('button[type="submit"]')
    await expect(page.locator('p[role="alert"]')).toContainText('không khớp')
    // Không rời trang đăng ký
    await expect(page).toHaveURL(/\/dang-ky/)
  })

  test('tên không hợp lệ → lỗi validation tiếng Việt', async ({ page }) => {
    await page.goto('/dang-ky')
    // Chữ hoa + ký tự đặc biệt vi phạm regex server-side
    await page.fill('#username', 'Ten Khong Hop Le')
    await page.fill('#password', PASSWORD)
    await page.fill('#confirm', PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page.locator('p[role="alert"]')).toContainText('3-24 ký tự')
  })

  test('link qua lại giữa đăng nhập ↔ đăng ký', async ({ page }) => {
    await page.goto('/dang-nhap')
    await page.getByRole('link', { name: 'Đăng ký ngay' }).click()
    await expect(page).toHaveURL(/\/dang-ky/)
    await page.getByRole('link', { name: 'Đăng nhập' }).click()
    await expect(page).toHaveURL(/\/dang-nhap/)
  })
})
