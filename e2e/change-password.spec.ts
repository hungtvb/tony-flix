// @ts-nocheck
import { test, expect } from '@playwright/test'

// Đăng ký user mới, tự login rồi đổi mật khẩu qua dialog/API.
// Chạy trong project 'guest' (chưa login sẵn) — test tự tạo phiên.

const PASSWORD = 'matkhau-123'
const NEW_PASSWORD = 'matkhaumoi-456'

async function registerAndLogin(page: any) {
  const username = `pw${Date.now().toString(36)}`
  await page.request.post('/api/dang-ky', {
    data: { username, password: PASSWORD },
    headers: { 'Content-Type': 'application/json' },
  })
  await page.request.post('/api/dang-nhap', {
    data: { username, password: PASSWORD },
    headers: { 'Content-Type': 'application/json' },
  })
  return username
}

test.describe('Đổi mật khẩu', () => {
  test('đổi pass thành công, login pass mới OK / pass cũ FAIL', async ({ page }) => {
    const username = await registerAndLogin(page)
    await page.goto('/')

    // Đổi mật khẩu qua API (cùng context cookie)
    const res = await page.request.post('/api/doi-mat-khau', {
      data: { oldPassword: PASSWORD, newPassword: NEW_PASSWORD },
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status()).toBe(200)
    expect((await res.json()).ok).toBe(true)

    // Đăng xuất
    await page.request.post('/api/thoat', { method: 'POST' })

    // Pass cũ FAIL
    const oldFail = await page.request.post('/api/dang-nhap', {
      data: { username, password: PASSWORD },
      headers: { 'Content-Type': 'application/json' },
    })
    expect(oldFail.status()).toBe(401)

    // Pass mới OK
    const newOk = await page.request.post('/api/dang-nhap', {
      data: { username, password: NEW_PASSWORD },
      headers: { 'Content-Type': 'application/json' },
    })
    expect(newOk.status()).toBe(200)
  })

  test('sai mật khẩu hiện tại → 400', async ({ page }) => {
    await registerAndLogin(page)
    const res = await page.request.post('/api/doi-mat-khau', {
      data: { oldPassword: 'sai-roi', newPassword: NEW_PASSWORD },
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status()).toBe(400)
  })
})
