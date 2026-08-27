import { test, expect } from '@playwright/test'

/** Dashboard admin render số liệu + guard. */
test.describe('Admin dashboard', () => {
  test('guest vào /admin → redirect login', async ({ page }) => {
    await page.goto('/admin')
    await expect.poll(() => page.url()).toContain('dang-nhap')
  })

  test('admin vào /admin thấy Dashboard + số liệu', async ({ request, page }) => {
    const login = await request.post('/api/dang-nhap', {
      data: { username: process.env.E2E_USER ?? 'admin', password: process.env.E2E_PASS ?? 'tonyflix' },
    })
    const cookie = login.headers()['set-cookie']?.split(';')[0]
    await page.context().addCookies([
      { name: 'tf_session', value: cookie!.split('=')[1], path: '/', domain: 'localhost' },
    ])
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText('Tổng người dùng')).toBeVisible()
    // có ít nhất 1 thẻ có số (stat card)
    await expect(page.locator('text=/\\d+/').first()).toBeVisible()
  })
})
