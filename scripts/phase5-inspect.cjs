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
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'screenshots/current/10-home-loggedin.png', fullPage: false })

  // Mở 1 phim để ghi watch progress
  await page.goto(`${BASE}/phim/nguoi-nhen-khong-con-nha`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await page.screenshot({ path: 'screenshots/current/11-detail-spiderman.png', fullPage: false })
  // Click first episode to trigger watch-tracker POST
  const firstEp = page.locator('[data-testid=episode-item]').first()
  if (await firstEp.count()) {
    await firstEp.click()
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'screenshots/current/12-watch-page.png', fullPage: false })
  }
  // Back home to see Continue Watching populated
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'screenshots/current/13-home-continue.png', fullPage: false })

  const cw = await page.locator('text=Tiếp tục xem').count()
  console.log('Continue Watching heading visible:', cw)
  await b.close()
})().catch((e) => { console.error('ERR', e); process.exit(1) })
