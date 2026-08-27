/* Capture nốt các màn hình còn lại (detail/watch/yeu-thich/search/the-loai). */
const { chromium } = require('@playwright/test')
const BASE = process.env.BASE_URL || 'http://localhost:3987'
const OUT = '/tmp/tony-flix-app/screenshots/current'
const fs = require('fs')
fs.mkdirSync(OUT, { recursive: true })

async function shot(page, name, full = true) {
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full })
  console.log('shot', name)
}

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const username = `ui${Date.now().toString(36)}`
  const password = 'matkhau-123'

  // register + login
  await page.goto(`${BASE}/dang-ky`)
  await page.fill('#username', username)
  await page.fill('#password', password)
  await page.fill('#confirm', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(`${BASE}/`, { timeout: 15000 }).catch(() => {})

  // lấy slug phim từ home (chắc chắn có card)
  await page.goto(`${BASE}/`)
  await page.waitForSelector('a[href^="/phim/"]', { timeout: 20000 }).catch(() => {})
  const firstHref = await page.locator('a[href^="/phim/"]').first().getAttribute('href').catch(() => null)
  const slug = firstHref ? firstHref.split('/').pop() : null
  console.log('picked slug:', slug)

  if (slug) {
    // DETAIL
    try {
      await page.goto(`${BASE}/phim/${slug}`)
      await page.waitForSelector('main', { timeout: 15000 }).catch(() => {})
      await shot(page, '05-phim-detail-desktop', true)
      // mobile
      await page.setViewportSize({ width: 390, height: 844 })
      await page.waitForTimeout(500)
      await shot(page, '05b-phim-detail-mobile', true)
      await page.setViewportSize({ width: 1440, height: 900 })

      // set favorite via API
      await page.evaluate(async (s) => {
        await fetch('/api/yeu-thich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: s }),
        })
      }, slug)

      // WATCH
      try {
        await page.goto(`${BASE}/xem/${slug}`, { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(2500)
        await page.screenshot({ path: `${OUT}/06-xem-desktop.png`, fullPage: false })
        console.log('shot 06-xem-desktop')
      } catch (e) { console.log('xem skipped:', e.message) }
    } catch (e) { console.log('detail skipped:', e.message) }
  }

  // YEU THICH
  try {
    await page.goto(`${BASE}/yeu-thich`)
    await page.waitForSelector('main', { timeout: 15000 }).catch(() => {})
    await shot(page, '07-yeu-thich-desktop', true)
  } catch (e) { console.log('yeu-thich skipped:', e.message) }

  // TIM KIEM
  try {
    await page.goto(`${BASE}/tim-kiem?keyword=harry`)
    await page.waitForSelector('main', { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(1000)
    await shot(page, '08-tim-kiem-desktop', true)
  } catch (e) { console.log('tim-kiem skipped:', e.message) }

  // THE LOAI (robust wait: cards OR empty-state msg)
  try {
    await page.goto(`${BASE}/the-loai/kinh-di`)
    await page.waitForSelector('main', { timeout: 15000 }).catch(() => {})
    // đợi 1 trong 2: card hoặc text "Đang tải"/"Chưa có"
    await page.waitForFunction(() => {
      return document.querySelector('a[href^="/phim/"]') ||
             /Đang tải|Chưa có/.test(document.body.innerText)
    }, null, { timeout: 15000 }).catch(() => {})
    await shot(page, '09-the-loai-desktop', true)
  } catch (e) { console.log('the-loai skipped:', e.message) }

  await browser.close()
  console.log('DONE')
})().catch((e) => { console.error(e); process.exit(1) })
