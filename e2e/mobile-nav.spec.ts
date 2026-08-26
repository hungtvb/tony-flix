// @ts-nocheck
import { test, expect } from '@playwright/test'

// Phải login trước vì navbar (và mọi trang (main)) yêu cầu phiên — khách chỉ
// vào được /dang-nhap /dang-ky (không có navbar). Tự đăng ký user mới mỗi
// lần chạy nên spec chạy lại được.
// Nút hamburger chỉ hiện dưới breakpoint sm (640px).

async function loginNewUser(page: any) {
  const username = `mnav${Date.now().toString(36)}`
  const password = 'matkhau123'
  await page.request.post('/api/dang-ky', {
    data: { username, password },
    headers: { 'Content-Type': 'application/json' },
  })
  await page.request.post('/api/dang-nhap', {
    data: { username, password },
    headers: { 'Content-Type': 'application/json' },
  })
  return username
}

test.describe('Mobile hamburger menu', () => {
  test('mở menu thấy link Mới cập nhật, click vào đúng URL', async ({ page }) => {
    await loginNewUser(page)
    await page.setViewportSize({ width: 412, height: 915 })
    await page.goto('/')

    const menuBtn = page.getByRole('button', { name: 'Mở menu' })
    await expect(menuBtn).toBeVisible()
    await menuBtn.click()

    const moiCapNhat = page.getByRole('link', { name: 'Mới cập nhật' })
    await expect(moiCapNhat).toBeVisible()
    await moiCapNhat.click()
    await expect(page).toHaveURL(/\/moi-cap-nhat/)
  })

  test('panel chứa đủ các mục điều hướng chính', async ({ page }) => {
    await loginNewUser(page)
    await page.setViewportSize({ width: 412, height: 915 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Mở menu' }).click()
    await expect(page.getByRole('link', { name: 'Trang chủ' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Thể loại' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Quốc gia' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Năm phát hành' })).toBeVisible()
  })
})
