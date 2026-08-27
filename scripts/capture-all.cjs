/* Capture toàn bộ màn hình tony-flix để phân tích UX hiện tại. */
const { chromium } = require('@playwright/test')

const BASE = process.env.BASE_URL || 'http://localhost:3987'
const OUT = '/tmp/tony-flix-app/screenshots/current'
const fs = require('fs')
fs.mkdirSync(OUT, { recursive: true })

async function shot(page, name) {
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
  console.log('shot', name)
}

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const username = `ui${Date.now().toString(36)}`
  const password = 'matkhau-123'

  // --- AUTH PAGES (desktop + mobile) ---
  await page.goto(`${BASE}/dang-nhap`)
  await shot(page, '01-dang-nhap-desktop')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(400)
  await shot(page, '01b-dang-nhap-mobile')
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(`${BASE}/dang-ky`)
  await shot(page, '02-dang-ky-desktop')

  // --- REGISTER + LOGIN ---
  await page.fill('#username', username)
  await page.fill('#password', password)
  await page.fill('#confirm', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(`${BASE}/`, { timeout: 15000 }).catch(() => {})

  // --- HOME (desktop full + mobile) ---
  await page.goto(`${BASE}/`)
  await page.waitForSelector('main', { timeout: 15000 }).catch(() => {})
  await shot(page, '03-home-desktop')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(500)
  await shot(page, '03b-home-mobile')
  await page.setViewportSize({ width: 1440, height: 900 })

  // --- MOI CAP NHAT ---
  await page.goto(`${BASE}/moi-cap-nhat`)
  await page.waitForSelector('main', { timeout: 15000 }).catch(() => {})
  await shot(page, '04-moi-cap-nhat-desktop')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(500)
  await shot(page, '04b-moi-cap-nhat-mobile')
  await page.setViewportSize({ width: 1440, height: 900 })

  // --- PICK A FILM (detail + watch) ---
  await page.goto(`${BASE}/the-loai/hoat-hinh`)
  await page.waitForSelector('a[href^="/phim/"]', { timeout: 15000 }).catch(() => {})
  const firstHref = await page.locator('a[href^="/phim/"]').first().getAttribute('href')
  if (firstHref) {
    await page.goto(`${BASE}${firstHref}`)
    await page.waitForSelector('main', { timeout: 15000 }).catch(() => {})
    await shot(page, '05-phim-detail-desktop')
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(500)
    await shot(page, '05b-phim-detail-mobile')
    await page.setViewportSize({ width: 1440, height: 900 })

    // set favorite via API (deterministic)
    const slug = firstHref.split('/').pop()
    await page.evaluate(async (s) => {
      await fetch('/api/yeu-thich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: s }),
      })
    }, slug)

    // xem (iframe) - domcontentloaded vì embed treo load
    await page.goto(`${BASE}/xem/${slug}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)
    await page.screenshot({ path: `${OUT}/06-xem-desktop.png`, fullPage: false })
    console.log('shot 06-xem-desktop')
  }

  // --- YEU THICH ---
  await page.goto(`${BASE}/yeu-thich`)
  await page.waitForSelector('main', { timeout: 15000 }).catch(() => {})
  await shot(page, '07-yeu-thich-desktop')

  // --- TIM KIEM ---
  await page.goto(`${BASE}/tim-kiem?keyword=harry`)
  await page.waitForSelector('main', { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(800)
  await shot(page, '08-tim-kiem-desktop')

  // --- THE LOAI (category browser) ---
  await page.goto(`${BASE}/the-loai/kinh-di`)
  await page.waitForSelector('main', { timeout: 15000 }).catch(() => {})
  await shot(page, '09-the-loai-desktop')

  await browser.close()
  console.log('DONE')
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
