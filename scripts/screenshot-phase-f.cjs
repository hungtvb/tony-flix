/* Chụp screenshot bộ tính năng Phase F để review trực quan. */
const { chromium } = require('@playwright/test')

const BASE = process.env.BASE_URL || 'http://localhost:3987'
const OUT = '/tmp/tony-flix-app/screenshots'

/** Đợi nút tim render xong trạng thái đã bấm (aria-pressed=true). */
async function expectFavorite(page) {
  await page.waitForFunction(
    () => {
      const btn = [...document.querySelectorAll('button')].find((b) =>
        /yêu thích/i.test(b.getAttribute('aria-label') || ''),
      )
      return !!btn && btn.getAttribute('aria-pressed') === 'true'
    },
    null,
    { timeout: 15_000 },
  )
}

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const username = `shot${Date.now().toString(36)}`

  // Đăng ký + đăng nhập
  await page.goto(`${BASE}/dang-ky`)
  await page.fill('#username', username)
  await page.fill('#password', 'matkhau-123')
  await page.fill('#confirm', 'matkhau-123')
  await page.click('button[type="submit"]')
  await page.waitForURL(`${BASE}/`)

  // Chọn phim có tập từ hàng Mới cập nhật
  const cards = page.locator('a[href^="/phim/"]')
  await cards.first().waitFor({ state: 'visible', timeout: 20_000 })
  let detailHref = null
  for (let i = 0; i < 6 && !detailHref; i++) {
    const href = await cards.nth(i).getAttribute('href')
    await page.goto(`${BASE}${href}`)
    const ep = page.locator('a[href^="/xem/"]').first()
    try {
      await ep.waitFor({ state: 'visible', timeout: 6_000 })
      detailHref = href
    } catch {}
  }
  if (!detailHref) throw new Error('không tìm thấy phim có tập')

  // Set favorite qua API trực tiếp (deterministic, tránh race hydration khi click)
  await page.evaluate(async (href) => {
    const slug = href.split('/').pop()
    const r = await fetch('/api/yeu-thich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    })
    if (!r.ok && r.status !== 409) throw new Error(`POST yeu-thich failed: ${r.status}`)
  }, detailHref)

  // Vào trang chi tiết — nút tim phải render sẵn trạng thái đã bấm
  await page.goto(`${BASE}${detailHref}`)
  await expectFavorite(page)
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}/f3-detail-heart.png` })

  // Trang yêu thích
  await page.goto(`${BASE}/yeu-thich`)
  await page.locator('a[href^="/phim/"]').first().waitFor({ state: 'visible', timeout: 15_000 })
  await page.screenshot({ path: `${OUT}/f4-favorites-page.png` })

  // Mở trang xem để WatchTracker tự ghi tiến độ
  const slug = detailHref.split('/').pop()
  await page.goto(`${BASE}/xem/${slug}`, { waitUntil: 'domcontentloaded' })
  await page
    .waitForResponse((r) => r.url().includes('/api/tien-do') && r.request().method() === 'POST', { timeout: 15_000 })
    .catch(() => null)
  await page.goto(`${BASE}/`)
  await page.getByRole('heading', { name: 'Tiếp tục xem' }).waitFor({ state: 'visible', timeout: 15_000 })
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${OUT}/f6-home-continue-watching.png` })

  await browser.close()
  console.log('OK: 3 screenshots saved to', OUT)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
