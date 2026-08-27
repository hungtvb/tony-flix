const { chromium } = require('@playwright/test')
const BASE = 'http://localhost:3987'

;(async () => {
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
  const m = await ctx.newPage()
  // khách chưa login: truy cập trực tiếp (middleware sẽ redirect login, nhưng test menu trên login page)
  await m.goto(BASE + '/dang-nhap', { waitUntil: 'networkidle' })
  await m.waitForTimeout(400)
  await m.getByRole('button', { name: 'Mở menu' }).click()
  await m.waitForTimeout(400)
  const hasYeuThich = await m.getByText('Yêu thích').count()
  console.log('guest mobile menu has Yêu thích:', hasYeuThich)
  await m.screenshot({ path: 'screenshots/current/03e-guest-mobile-menu.png' })
  console.log('guest mobile menu shot done')
  await b.close()
})().catch(e => { console.error(e.message); process.exit(1) })
