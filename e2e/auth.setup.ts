import { expect, test as setup } from '@playwright/test'

/**
 * Setup project: đăng nhập 1 lần qua API rồi lưu storageState cho các project còn lại.
 * Chạy trước (dependencies: ['setup'] trong playwright.config.ts).
 */
const authFile = 'e2e/.auth/user.json'

setup('authenticate', async ({ request }) => {
  const res = await request.post('/api/dang-nhap', {
    data: { username: process.env.E2E_USER ?? 'admin', password: process.env.E2E_PASS ?? 'tonyflix' },
  })
  expect(res.ok()).toBeTruthy()
  await request.storageState({ path: authFile })
})
