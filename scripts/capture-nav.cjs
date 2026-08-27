const { chromium } = require('@playwright/test')
const BASE = 'http://localhost:3987'

;(async () => {
  const b = await chromium.launch()

  // Desktop login via UI
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const d = await ctx.newPage()
  await d.goto(BASE + '/dang-nhap', { waitUntil: 'networkidle' })
  await d.fill('input[name="username"]', 'admin')
  await d.fill('input[name="password"]', 'tonyflix')
  await d.click('button[type="submit"]')
  await d.waitForURL((u) => u.pathname === '/', { timeout: 10000 })
  await d.waitForTimeout(800)
  await d.screenshot({ path: 'screenshots/current/00-navbar-desktop.png' })
  console.log('navbar desktop shot done')

  const genreBtn = d.getByRole('button', { name: 'Thể loại' })
  await genreBtn.waitFor({ state: 'visible', timeout: 5000 })
  await genreBtn.hover()
  await d.waitForTimeout(500)
  await d.screenshot({ path: 'screenshots/current/00b-navbar-dropdown.png' })
  console.log('navbar dropdown shot done')

  await d.goto(BASE + '/the-loai', { waitUntil: 'networkidle' })
  await d.waitForTimeout(500)
  await d.screenshot({ path: 'screenshots/current/03c-theloai-index.png' })
  console.log('theloai index shot done')

  // mobile menu
  const m = await b.newContext({ viewport: { width: 390, height: 844 } })
  const mp = await m.newPage()
  await mp.goto(BASE + '/dang-nhap', { waitUntil: 'networkidle' })
  await mp.fill('input[name="username"]', 'admin')
  await mp.fill('input[name="password"]', 'tonyflix')
  await mp.click('button[type="submit"]')
  await mp.waitForURL((u) => u.pathname === '/', { timeout: 10000 })
  await mp.waitForTimeout(600)
  await mp.getByRole('button', { name: 'Mở menu' }).click()
  await mp.waitForTimeout(400)
  await mp.screenshot({ path: 'screenshots/current/03d-mobile-menu.png' })
  console.log('mobile menu shot done')

  await b.close()
})().catch(e => { console.error(e.message); process.exit(1) })
