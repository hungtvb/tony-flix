import { test, expect } from '@playwright/test'

/** Shared slug dùng cho các trang data-dependent. Override qua env E2E_SLUG. */
export const SLUG = process.env.E2E_SLUG ?? 'nguoi-nhen-khong-con-nha'
export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3987'

test.beforeEach(async ({ request }) => {
  // Guard chung: API proxy phải sống trước khi chạy UI tests
  const res = await request.get(`${BASE_URL}/api/latest?page=1`)
  expect(res.status()).toBe(200)
})

test.describe('Trang chủ', () => {
  test('hiển thị hero billboard + hàng phim mới', async ({ page }) => {
    await page.goto('/')

    // Brand + accent lime Tony
    await expect(page.getByRole('link', { name: /TONYFLIX/i })).toBeVisible()
    const logo = page.getByRole('link', { name: /TONYFLIX/i })
    await expect(logo).toHaveCSS('color', 'rgb(228, 242, 34)')

    // Hero hoặc fallback state đều hợp lệ, nhưng phải có h1
    await expect(page.locator('h1')).toBeVisible()

    // Hàng "Mới cập nhật" với card phim
    await expect(page.getByRole('heading', { name: 'Mới cập nhật' })).toBeVisible()
    const cards = page.locator('a[href^="/phim/"]')
    await expect(cards.first()).toBeVisible()
    const count = await cards.count()
    expect(count).toBeGreaterThanOrEqual(5)
  })

  test('card hover hiện overlay Xem ngay', async ({ page }) => {
    // Overlay hover chỉ tồn tại trên desktop (mobile bấm thẳng vào card)
    test.skip(test.info().project.name === 'mobile', 'Overlay hover không áp dụng cho touch')
    await page.goto('/')
    const card = page.locator('a[href^="/phim/"]').nth(1)
    await card.hover()
    await expect(card.getByText('Xem ngay')).toBeVisible()
  })

  test('nút Thông tin điều hướng sang trang chi tiết', async ({ page }) => {
    await page.goto('/')
    // exact: tránh trùng chữ "Thông tin" nếu xuất hiện nơi khác
    const infoBtn = page.getByRole('link', { name: 'Thông tin', exact: true }).first()
    if (await infoBtn.isVisible()) {
      await infoBtn.click()
      await expect(page).toHaveURL(/\/phim\//)
    }
  })

  test('không còn jargon kỹ thuật trong UI copy', async ({ page }) => {
    await page.goto('/')
    const body = await page.locator('body').innerText()
    for (const banned of ['NguonC', 'Cloudflare', 'refero', 'relay']) {
      expect(body).not.toContain(banned)
    }
  })
})

test.describe('Navbar', () => {
  test('icon search hiển thị bằng SVG lucide (không emoji)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    // Desktop: input thường + icon SVG trong form
    const searchInput = page.locator('input[name="keyword"]')
    await expect(searchInput).toBeVisible()
    const form = searchInput.locator('xpath=ancestor::form[1]')
    await expect(form.locator('svg')).toBeVisible()

    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/[→←▶ℹ]/)
  })

  test('mobile: ô tìm kiếm thu gọn thành icon toggle', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    // input desktop ẩn trên mobile (vẫn nằm trong DOM nhưng display:none)
    await expect(page.locator('input[name="keyword"]')).toBeHidden()
    const toggle = page.getByRole('button', { name: 'Tìm kiếm' })
    await expect(toggle).toBeVisible()
    await toggle.click()
    // input mobile nằm trong form bung ra (khác với input desktop ẩn)
    const mobileInput = page.getByPlaceholder('Tìm phim…').nth(1)
    await expect(mobileInput).toBeVisible()
  })

  test('điều hướng Mới cập nhật hoạt động', async ({ page }) => {
    // Known gap: nav links ẩn trên mobile (hidden sm:flex) — cần hamburger menu
    test.skip(test.info().project.name === 'mobile', 'Nav menu chưa có bản mobile')
    await page.goto('/')
    await page.getByRole('link', { name: 'Mới cập nhật' }).first().click()
    await expect(page).toHaveURL(/\/moi-cap-nhat/)
    await expect(page.locator('h1')).toContainText('Mới cập nhật')
  })
})

test.describe('Trang chi tiết phim', () => {
  test(`hiển thị đầy đủ thông tin cho "${SLUG}"`, async ({ page }) => {
    await page.goto(`/phim/${SLUG}`)

    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('h1')).not.toBeEmpty()

    // Nút Xem ngay với icon Play (exact: tránh trùng overlay text trên card)
    const watchBtn = page.getByRole('link', { name: 'Xem ngay', exact: true })
    await expect(watchBtn).toBeVisible()
    await expect(watchBtn.locator('svg')).toBeVisible()

    // Poster render (alt rỗng = backdrop trang trí, alt có tên = poster chính)
    const movieName = (await page.locator('h1').first().textContent())?.trim() ?? ''
    await expect(page.locator(`img[alt="${movieName}"]`)).toBeVisible()
  })

  test('danh sách tập dẫn sang trang xem', async ({ page }) => {
    await page.goto(`/phim/${SLUG}`)
    const epLinks = page.locator('a[href*="/xem/"]')
    const count = await epLinks.count()
    test.skip(count === 0, 'Phim chưa có tập')
    await expect(epLinks.first()).toBeVisible()
  })
})

test.describe('Trang xem phim (player)', () => {
  test(`player iframe embed trực tiếp cho "${SLUG}"`, async ({ page }) => {
    await page.goto(`/xem/${SLUG}`)

    // Player phải là iframe trực tiếp (KHÔNG srcdoc wrapper, KHÔNG sandbox)
    const player = page.locator('iframe').first()
    await expect(player).toBeVisible()
    expect(await player.getAttribute('srcdoc')).toBeNull()
    expect(await player.getAttribute('sandbox')).toBeNull()
    expect(await player.getAttribute('src')).toMatch(/^https:\/\//)

    // Quyền playback giữ nguyên
    expect(await player.getAttribute('allow')).toContain('autoplay')
    expect(await player.getAttribute('allow')).toContain('fullscreen')
  })

  test('tiêu đề phim + điều hướng tập hiển thị đúng', async ({ page }) => {
    await page.goto(`/xem/${SLUG}`)
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('h1')).not.toBeEmpty()

    // Nút Thông tin quay lại trang chi tiết
    await expect(page.getByRole('link', { name: /Thông tin/ })).toBeVisible()
  })

  test('tập đang xem highlight màu lime', async ({ page }) => {
    await page.goto(`/xem/${SLUG}`)
    const active = page.locator('span.bg-acid-lime').first()
    await expect(active).toBeVisible()
    await expect(active).toHaveCSS('background-color', 'rgb(228, 242, 34)')
  })
})

test.describe('Tìm kiếm', () => {
  test('search từ navbar (mobile) trả kết quả', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Tìm kiếm' }).click()
    const input = page.getByPlaceholder('Tìm phim…').nth(1)
    await input.fill('người nhện')
    await input.press('Enter')

    await expect(page).toHaveURL(/tim-kiem/)
    await expect(page.locator('h1')).toContainText('Kết quả cho')
  })

  test('keyword rỗng hiện hướng dẫn', async ({ page }) => {
    await page.goto('/tim-kiem')
    await expect(page.getByText(/Nhập tên phim/)).toBeVisible()
  })
})

test.describe('Mới cập nhật + phân trang', () => {
  test('lưới phim + pagination hiển thị', async ({ page }) => {
    await page.goto('/moi-cap-nhat')
    await expect(page.locator('h1')).toContainText('Mới cập nhật')

    const cards = page.locator('a[href^="/phim/"]')
    await expect(cards.first()).toBeVisible()

    // Pagination nav có thể ẩn nếu chỉ 1 trang — kiểm tra khi tồn tại
    const pag = page.getByRole('navigation', { name: 'Pagination' })
    if (await pag.isVisible()) {
      await expect(pag.locator('span.bg-acid-lime')).toBeVisible() // active pill
    }
  })
})

test.describe('404', () => {
  test('trang không tồn tại xử lý graceful (không crash, có nút về chủ)', async ({ page }) => {
    const res = await page.goto('/phim/khong-ton-tai-xyz-1234567890')
    // Relay NguonC đôi khi trả 200 kèm payload lỗi thay vì 404 hard —
    // quan trọng là trang hiển thị not-found UI thay vì đổ vỡ.
    await expect(page.getByText('Không tìm thấy trang này')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Về trang chủ' })).toBeVisible()
    expect(res?.status()).toBeLessThan(500)
  })
})
