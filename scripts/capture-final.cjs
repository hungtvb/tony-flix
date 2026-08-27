/* Capture TOÀN BỘ màn hình tony-flix (sau fix credentials) để review UX. */
const { chromium } = require('@playwright/test')
const BASE = process.env.BASE_URL || 'http://localhost:3987'
const OUT = '/tmp/tony-flix-app/screenshots/current'
const fs = require('fs')
fs.mkdirSync(OUT, { recursive: true })

async function shot(page, name, full = true) {
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full })
  console.log('shot', name)
}
const waitCards = async (page) => {
  await page.waitForFunction(() =>
    document.querySelector('a[href^="/phim/"]') ||
    /Đang tải|Chưa có|Không thể/.test(document.body.innerText),
  null, { timeout: 20000 }).catch(() => {})
}

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const username = `ui${Date.now().toString(36)}`
  const password = 'matkhau-123'

  // AUTH
  await page.goto(`${BASE}/dang-nhap`); await shot(page, '01-dang-nhap-desktop')
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(400); await shot(page, '01b-dang-nhap-mobile')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${BASE}/dang-ky`); await shot(page, '02-dang-ky-desktop')

  // REGISTER + LOGIN
  await page.goto(`${BASE}/dang-ky`)
  await page.fill('#username', username); await page.fill('#password', password); await page.fill('#confirm', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(`${BASE}/`).catch(() => {})

  // HOME (đợi category rows + cards)
  await page.goto(`${BASE}/`)
  await page.waitForSelector('a[href^="/phim/"]', { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(1500)
  await shot(page, '03-home-desktop')
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(600); await shot(page, '03b-home-mobile')
  await page.setViewportSize({ width: 1440, height: 900 })

  // MOI CAP NHAT
  await page.goto(`${BASE}/moi-cap-nhat`); await waitCards(page); await shot(page, '04-moi-cap-nhat-desktop')
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(600); await shot(page, '04b-moi-cap-nhat-mobile')
  await page.setViewportSize({ width: 1440, height: 900 })

  // pick film from home
  const firstHref = await page.locator('a[href^="/phim/"]').first().getAttribute('href').catch(() => null)
  const slug = firstHref ? firstHref.split('/').pop() : null
  console.log('picked slug:', slug)

  if (slug) {
    await page.goto(`${BASE}/phim/${slug}`); await page.waitForSelector('main', { timeout: 15000 }).catch(()=>{})
    await shot(page, '05-phim-detail-desktop', true)
    await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(600); await shot(page, '05b-phim-detail-mobile', true)
    await page.setViewportSize({ width: 1440, height: 900 })
    // set fav via API
    await page.evaluate(async (s) => { await fetch('/api/yeu-thich', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'same-origin', body: JSON.stringify({ slug: s }) }) }, slug)
    try {
      await page.goto(`${BASE}/xem/${slug}`, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2500)
      await page.screenshot({ path: `${OUT}/06-xem-desktop.png`, fullPage: false }); console.log('shot 06-xem-desktop')
    } catch (e) { console.log('xem skip:', e.message) }
  }

  // YEU THICH
  await page.goto(`${BASE}/yeu-thich`); await waitCards(page); await shot(page, '07-yeu-thich-desktop', true)

  // TIM KIEM
  await page.goto(`${BASE}/tim-kiem?keyword=harry`); await waitCards(page); await shot(page, '08-tim-kiem-desktop', true)

  // THE LOAI
  await page.goto(`${BASE}/the-loai/kinh-di`); await waitCards(page); await shot(page, '09-the-loai-desktop', true)

  await browser.close(); console.log('DONE')
})().catch((e) => { console.error(e); process.exit(1) })
