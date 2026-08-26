import { defineConfig, devices } from '@playwright/test'

/**
 * TonyFlix E2E suite.
 * - Local: `npm run build && npm start` then `npx playwright test`
 * - Env: BASE_URL (default http://localhost:3987), E2E_SLUG (default phim co san)
 * - Auth: project 'setup' login qua /api/dang-nhap → storageState dùng chung cho
 *   chromium/mobile; các test gate/auth chạy riêng trong project 'guest'
 *   (storageState rỗng — đảm bảo trạng thái chưa đăng nhập).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 3,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e-report' }]],
  outputDir: 'e2e-results',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3987',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, storageState: 'e2e/.auth/user.json' },
      dependencies: ['setup'],
      testIgnore: /auth\.(setup|spec)\.ts/,
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], storageState: 'e2e/.auth/user.json' }, // Chromium-based (WebKit not installed)
      dependencies: ['setup'],
      testIgnore: /auth\.(setup|spec)\.ts/,
    },
    {
      name: 'guest',
      testMatch: /auth\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      // KHÔNG dependencies: không login trước — mọi request là khách thật
    },
  ],
})
