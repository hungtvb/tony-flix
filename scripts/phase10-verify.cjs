const { chromium } = require('@playwright/test')
const BASE = 'http://localhost:3987'

;(async () => {
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/dang-nhap`, { waitUntil: 'networkidle' })
  await page.fill('input[name=username]', 'admin')
  await page.fill('input[name=password]', 'tonyflix')
  await page.click('button[type=submit]')
  await page.waitForURL('**/', { timeout: 10000 })
  await page.waitForTimeout(800)

  // Dark mode (default)
  await page.screenshot({ path: 'screenshots/current/16-dark-home.png', fullPage: false })

  // Toggle to light
  await page.click('button[aria-label*="giao diện sáng"]')
  await page.waitForTimeout(600)
  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
  console.log('theme after toggle:', theme)
  await page.screenshot({ path: 'screenshots/current/17-light-home.png', fullPage: false })

  // Reload to verify persistence (anti-flash script)
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const theme2 = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
  console.log('theme after reload (persist):', theme2)

  await b.close()
})().catch((e) => { console.error('ERR', e); process.exit(1) })
