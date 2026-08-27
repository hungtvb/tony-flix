const { chromium } = require('@playwright/test')
const BASE = 'http://localhost:3987'

;(async () => {
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const d = await ctx.newPage()
  await d.goto(BASE + '/dang-nhap', { waitUntil: 'networkidle' })
  await d.fill('input[name="username"]', 'admin')
  await d.fill('input[name="password"]', 'tonyflix')
  await d.click('button[type="submit"]')
  await d.waitForURL((u) => u.pathname === '/', { timeout: 10000 })
  await d.waitForTimeout(700)
  await d.screenshot({ path: 'screenshots/current/00e-user-icon.png' })

  // click avatar -> open menu
  await d.getByRole('button', { name: 'Tài khoản' }).click()
  await d.waitForTimeout(400)
  await d.screenshot({ path: 'screenshots/current/00f-user-menu.png' })
  console.log('user menu shot done')
  await b.close()
})().catch(e => { console.error(e.message); process.exit(1) })
