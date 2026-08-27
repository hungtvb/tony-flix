import { test, expect } from '@playwright/test'

function cookieFrom(res: { headers(): Record<string, string> }): string {
  const c = res.headers()['set-cookie']
  return c ? c.split(';')[0] : ''
}

test.describe('Admin users page', () => {
  test('admin vào /admin/users thấy bảng + thao tác', async ({ request, page }) => {
    const login = await request.post('/api/dang-nhap', {
      data: { username: process.env.E2E_USER ?? 'admin', password: process.env.E2E_PASS ?? 'tonyflix' },
    })
    const cookie = cookieFrom(login)
    await page.context().addCookies([
      { name: 'tf_session', value: cookie.split('=')[1], path: '/', domain: 'localhost' },
    ])

    // tạo 1 user test
    const uname = `uipage_${Date.now()}`
    const reg = await request.post('/api/dang-ky', { data: { username: uname, password: 'Passw0rd!' } })
    expect(reg.ok()).toBeTruthy()

    await page.goto('/admin/users')
    await expect(page.getByRole('heading', { name: 'Người dùng' })).toBeVisible()
    // tìm user vừa tạo
    await page.getByPlaceholder('Tìm theo tên user...').fill(uname)
    await expect(page.getByText(uname, { exact: true })).toBeVisible({ timeout: 10000 })

    // xoá user (confirm dialog)
    page.on('dialog', (d) => d.accept())
    await page.getByRole('button', { name: 'Xoá' }).first().click()
    await expect(page.getByText(uname, { exact: true })).toHaveCount(0, { timeout: 10000 })
  })
})
