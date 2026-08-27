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

  // Add a favorite via API
  await page.evaluate(() => fetch('/api/yeu-thich', { method: 'POST', credentials: 'same-origin', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ slug: 'nguoi-nhen-khong-con-nha' }) }))
  await page.waitForTimeout(800)

  // Public watchlist (no auth context)
  const apiRes = await page.evaluate(async () => {
    const r = await fetch('/api/yeu-thich/admin')
    const j = await r.json()
    return { status: r.status, total: j.total, first: j.items?.[0]?.name }
  })
  console.log('Public /api/yeu-thich/admin:', JSON.stringify(apiRes))

  // Visit public watchlist page in fresh context (no auth)
  const ctx2 = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const p2 = await ctx2.newPage()
  await p2.goto(`${BASE}/yeu-thich/admin`, { waitUntil: 'networkidle' })
  await p2.waitForTimeout(2000)
  const wlTitle = await p2.locator('h1').first().innerText()
  await p2.screenshot({ path: 'screenshots/current/14-public-watchlist.png', fullPage: false })
  console.log('Public watchlist page title:', wlTitle)

  // History page (authed)
  await page.goto(`${BASE}/lich-su`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  const histTitle = await page.locator('h1').first().innerText()
  await page.screenshot({ path: 'screenshots/current/15-history.png', fullPage: false })
  console.log('History page title:', histTitle)

  await b.close()
})().catch((e) => { console.error('ERR', e); process.exit(1) })
