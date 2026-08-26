# TonyFlix Production Upgrade Plan

> **For Hermes:** Thực hiện tuần tự theo phase, mỗi task một commit. Sau Phase 2 chụp UI gửi Đại ca review trước khi sang Phase 3.

**Goal:** Nâng tony-flix từ "app chạy được" lên web app xem phim chuẩn production: **cá nhân hóa (yêu thích + tiếp tục xem)**, bảo mật chặt, quan sát được, CI tự động, UX mobile trọn vẹn, SEO/PWA cơ bản.

**Architecture:** Giữ nguyên stack — Next.js 15 App Router (route groups `(main)`/`(auth)`), Tailwind v4, Postgres + Drizzle, signed-cookie sessions, nguồn dữ liệu NguonC qua API proxy có cache. Bổ sung theo lớp: security → observability/CI → UX → SEO/perf → DB bền vững. Không đổi gì URL hiện có.

**Tech stack:** Next.js 15.5, TypeScript strict, Tailwind v4 (`@theme` tokens), drizzle-orm + postgres, Playwright e2e (baseline **52 pass**), deploy Railway (auto từ `main`).

---

## Trạng thái hiện tại (assumptions)

- Repo `hungtvb/tony-flix`, branch `main` @ `01b5167`, local `/tmp/tony-flix-app`.
- Auth hoàn chỉnh: login/register + Postgres users (scrypt), middleware gate toàn trang.
- E2E: `scripts/e2e-with-auth.sh`, port 3987, project setup/guest/chromium/mobile.
- Đã biết còn thiếu: mobile nav ẩn (không hamburger), không security headers, đăng ký chưa rate-limit, không CI, không health check, không sitemap, không error boundary.

## Nguyên tắc xuyên suốt

- Mỗi task: code → verify thật (curl/e2e) → commit riêng. Không task nào "sẽ kiểm tra sau".
- Server local luôn chạy `PORT=3987`; trước khi restart phải kill `next-server` cũ trong `/proc/*/cmdline` (pitfall stale build).
- Không bao giờ commit secret; env mẫu chỉ placeholder trong `.env.example`.
- Player embed: KHÔNG sandbox/srcdoc lại iframe (đã từng vỡ playback) — mọi thay đổi liên quan frame phải test playback bằng DOM assertion.

---

# Phase F — Cá nhân hóa: Yêu thích + Tiếp tục xem (làm TRƯỚC Phase 0)

> Ràng buộc: player là iframe cross-origin → tiến độ theo **cấp tập** (không resume theo phút).

### Task F1: Schema favorites + watch_progress

**Files:** Modify `src/lib/db.ts` — pgTable `favorites` (PK composite user_id+film_slug), `watch_progress` (PK composite user_id+film_slug, cột episode, server_name, updated_at); `ensureSchema` thêm 2 câu `CREATE TABLE IF NOT EXISTS`.
**Verify:** psql `\dt` thấy bảng mới sau khi gọi 1 endpoint DB; build pass.
**Commit:** `feat(db): favorites + watch_progress tables`

### Task F2: API yêu thích

**Files:** Create `src/app/api/yeu-thich/route.ts` — POST `{slug}` thêm (409 nếu đã có), DELETE `{slug}` xoá, GET `?page=` danh sách (join title/poster qua nguonc.ts, fail mềm). Không public — middleware đã chặn.
**Test:** `e2e/favorites.spec.ts` (project guest): đăng ký user mới → POST → GET có slug → DELETE → GET trống; chưa login → 401.
**Verify:** curl kèm cookie thật; suite xanh.
**Commit:** `feat(api): favorites CRUD`

### Task F3: Nút tim ở trang chi tiết

**Files:** Create `src/components/favorite-button.tsx` (client, lucide Heart, optimistic, gọi API, chưa login → redirect `/dang-nhap`); Modify `(main)/phim/[slug]/page.tsx` render cạnh nút Xem ngay; trạng thái fill đọc từ GET list server-side.
**Verify:** e2e click tim → reload còn fill; click lần nữa → bỏ.
**Commit:** `feat(ui): favorite button on film detail`

### Task F4: Trang /yeu-thich

**Files:** Create `(main)/yeu-thich/page.tsx` (grid FilmCard tái sử dụng, empty-state "Chưa có phim yêu thích"); Modify navbar desktop + mobile-nav thêm link.
**Verify:** e2e đăng ký → thêm 1 phim → vào /yeu-thich thấy card; empty-state cho user mới.
**Commit:** `feat(page): favorites list page`

### Task F5: API tiến độ xem

**Files:** Create `src/app/api/tien-do/route.ts` — POST `{slug, episode, serverName}` upsert (ON CONFLICT update updated_at), GET top 20 theo updated_at (resolve title/poster fail mềm, kèm episode/server để resume).
**Test:** `e2e/watch-progress.spec.ts`: login → POST tập 2 → GET trả về đúng episode; POST lại tập 5 → GET trả tập 5 (upsert không nhân bản).
**Commit:** `feat(api): watch progress upsert + list`

### Task F6: Ghi tiến độ + hàng "Tiếp tục xem"

**Files:** Create `src/components/watch-tracker.tsx` (client, useEffect POST 1 lần mỗi lần mount trang xem, gửi sv/ep từ searchParams); Modify `(main)/xem/[slug]/page.tsx`; Create `src/components/continue-watching.tsx` (client fetch GET /api/tien-do, hàng FilmRow ngang badge "Tập N", click → `/xem/[slug]?sv=…&ep=…`); Modify home page chèn hàng đầu tiên khi có dữ liệu.
**Verify:** e2e: login → mở trang xem tập bất kỳ → về home thấy hàng Tiếp tục xem đúng phim + badge tập → click quay đúng tập.
**Commit:** `feat(ux): continue watching row + progress tracking`

### Task F7: ⚑ Screenshot review bộ tính năng mới

Chụp: detail có tim fill, /yeu-thich có nội dung, home có hàng Tiếp tục xem (desktop+mobile) → Telegram review trước khi sang Phase 0.

---

# Phase 0 — Security & stability (P0)

### Task 1: Trích xuất rate limiter dùng chung

**Objective:** DRY — tách logic đếm attempt khỏi route login thành module dùng chung được.

**Files:**
- Create: `src/lib/rate-limit.ts`
- Modify: `src/app/api/dang-nhap/route.ts` (bỏ Map/window nội bộ, import limiter)

**Nội dung:** export `checkRate(key: string): boolean` (true = vượt ngưỡng) và `hitRate(key: string)`, `resetRate(key)`. Ngưỡng đọc env: `RATE_LIMIT_MAX` (mặc định 10), `RATE_LIMIT_WINDOW_MS` (mặc định 900_000) — override thấp trong e2e/CI.

**Verify:** `npm run build` pass; e2e auth suite vẫn 52 pass.

**Commit:** `refactor(auth): shared rate limiter`

### Task 2: Rate limit cho đăng ký

**Objective:** Chặn lạm dụng tạo tài khoản hàng loạt.

**Files:**
- Modify: `src/app/api/dang-ky/route.ts` — key `reg|<ip>` , ngưỡng mặc định 5/giờ (`REGISTER_RATE_LIMIT_MAX`), trả 429 tiếng Việt "Thử quá nhiều lần…".

**Verify:** curl 6 lần đăng ký sai format liên tiếp → lần 6 HTTP 429; e2e vẫn pass (set env thấp trong `e2e-with-auth.sh`, không cản luồng test vì mỗi test username mới nhưng < ngưỡng).

**Commit:** `feat(auth): rate-limit registration`

### Task 3: Security headers

**Objective:** Headers chuẩn OWASP mà không vỡ player embed.

**Files:**
- Modify: `src/middleware.ts` — set trên response đi ra: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `X-Frame-Options: SAMEORIGIN`.
- CSP: thêm ở chế độ **Report-Only** trước (`Content-Security-Policy-Report-Only`) với `frame-src https:` (player embed) — quan sát không lỗi rồi mới bật enforce ở task sau nếu ổn.

**Verify:** `curl -sI http://localhost:3987/dang-nhap | grep -i 'x-frame\|x-content\|referrer'` thấy đủ header; e2e playback spec (tiêu đề + iframe render) vẫn pass; DOM assert iframe vẫn có attrs `allow` chuẩn.

**Commit:** `feat(security): OWASP headers + CSP report-only`

### Task 4: Health check endpoint

**Objective:** Railway healthcheck + uptime monitor có chỗ ping.

**Files:**
- Create: `src/app/api/health/route.ts` — GET `{ok:true, db:'up'|'down', uptime}`; db check = `SELECT 1` qua `getClient()` với try/catch, timeout 3s. Luôn 200 khi app sống (db down chỉ set flag) để healthcheck không kill pod oan.
- Modify: `src/middleware.ts` — thêm `/api/health` vào `PUBLIC_PATHS`.

**Verify:** `curl http://localhost:3987/api/health` → `{"ok":true,"db":"up",...}` không cần cookie.

**Commit:** `feat(ops): /api/health endpoint`

---

# Phase 1 — Observability & CI (P1)

### Task 5: Structured logger

**Objective:** Log JSON một dòng/event, có level, dễ grep trên Railway, tự redact trường nhạy cảm.

**Files:**
- Create: `src/lib/logger.ts` — `log.info/warn/error(event, fields)`: `JSON.stringify({t: iso, lvl, event, ...fields})`; hàm `redact(obj)` xoá key khớp `/pass|secret|token|cookie|hash/i`.
- Modify: `src/lib/db.ts`, `src/app/api/dang-nhap/route.ts`, `src/app/api/dang-ky/route.ts`, `src/app/api/thoat/route.ts` — thay `console.*` bằng logger (event: `db_lookup_failed`, `login_ok`, `login_failed{username}`, `register_ok`, …). KHÔNG log password/cookie.

**Verify:** build pass; login sai 1 lần → thấy dòng JSON `login_failed` trong stdout server, không có chuỗi mật khẩu nào trong log.

**Commit:** `feat(ops): structured logging with redaction`

### Task 6: GitHub Actions CI

**Objective:** Mọi push/PR vào main phải qua build + e2e xanh trước khi Railway deploy.

**Files:**
- Create: `.github/workflows/ci.yml`:
  - trigger: push/PR → main
  - services: `postgres:15` (health-cmd pg_isready), env `DATABASE_URL` trỏ service
  - steps: checkout → setup-node 22 cache npm → `npm ci` → `./scripts/e2e-with-auth.sh` (script đã tự build + seed user dbonly) → upload `e2e-report/` artifact nếu fail
  - env test: `AUTH_USERS=admin:tonyflix`, `AUTH_SECRET=<placeholder CI-only>`, `RATE_LIMIT_MAX=100`
- Modify: `README.md` — badge CI.

**Verify:** đẩy 1 commit nhỏ lên branch `chore/ci-test` → workflow chạy xanh trên GitHub (kiểm tra qua `gh run list`); merge vào main.

**Risks:** upstream NguonC API có thể chậm/chết lúc CI → Playwright đã có `retries: CI ? 1 : 0`; các spec phụ thuộc phim cụ thể dùng slug phổ biến. Nếu flake > 5% thì đánh dấu `test.fixme` các spec phụ thuộc dữ liệu động và ghi chú trong plan-update.

**Commit:** `ci: build + e2e gate on main`

### Task 7: Ops runbook trong README

**Objective:** Ai cũng tự vận hành được khi Đại ca ngủ.

**Files:**
- Modify: `README.md` — thêm mục "Vận hành": bảng env đầy đủ (gồm biến mới Phase 0), checklist deploy Railway, lệnh backup `pg_dump $DATABASE_URL > backup.sql` + restore, cách rotate `AUTH_SECRET` (ai đang login bị văng phiên — chấp nhận), rollback = redeploy commit cũ trên Railway.

**Commit:** `docs: ops runbook`

---

# Phase 2 — UX hoàn thiện (P2) ⚑ *Chụp UI review sau phase này*

### Task 8: Hamburger menu mobile

**Objective:** Nav mobile đầy đủ — gap đã biết từ v0.1.

**Files:**
- Create: `src/components/mobile-nav.tsx` — client component, nút lucide `Menu`/`X` (44px tap target), panel trượt xuống chứa: Trang chủ, Mới cập nhật, Thể loại (link `/the-loai`), Quốc gia (`/quoc-gia`), Năm phát hành (`/nam-phat-hanh`). Đóng khi click link hoặc click ngoài.
- Modify: `src/components/navbar.tsx` — render `<MobileNav />` cạnh search trên mobile; nhóm link desktop giữ `hidden sm:flex`.

**Test trước (RED):** thêm `e2e/mobile-nav.spec.ts` (project guest): viewport Pixel 7 → click nút menu → expect link "Mới cập nhật" visible → click → URL `/moi-cap-nhat`. Chạy fail vì component chưa tồn tại.

**Verify (GREEN):** implement → e2e pass; audit overflow mobile như cũ (scrollWidth == innerWidth).

**Commit:** `feat(nav): mobile hamburger menu`

### Task 9: Đổi mật khẩu

**Objective:** User tự quản tài khoản — chuẩn production tối thiểu.

**Files:**
- Create: `src/app/api/doi-mat-khau/route.ts` — POST `{oldPassword,newPassword}` (auth bắt buộc qua middleware), verify cũ qua `findDbAccount`, update hash; tài khoản env-fallback → 400 "Tài khoản hệ thống không thể đổi mật khẩu tại đây."
- Modify: `src/components/user-menu.tsx` — item "Đổi mật khẩu" mở dialog nhỏ (client), gọi API, thành công → toast/inline "Đã đổi".
- Create: `e2e/change-password.spec.ts` (project guest): đăng ký user mới → đổi pass → logout → login pass mới OK, pass cũ FAIL.

**Commit:** `feat(auth): change password`

### Task 10: Error boundary + loading states

**Objective:** Không bao giờ trắng trang / treo vô phản hồi.

**Files:**
- Create: `src/app/(main)/error.tsx` — client boundary, brand dark+lime, nút "Thử lại" (reset()), log qua logger.
- Create: `src/app/(main)/loading.tsx` — skeleton grid card (pulse) khớp FilmCard size mobile/desktop.
- Create: `src/app/(main)/phim/[slug]/loading.tsx`, `src/app/(main)/xem/[slug]/loading.tsx` — skeleton chi tiết/player.
- Modify: `src/app/(main)/not-found.tsx` — rà lại copy + nút về chủ (đã có, chỉ đồng bộ style).

**Verify:** tạm throw lỗi trong page detail dev-mode → thấy boundary đẹp; `curl` route chậm thấy skeleton HTML; e2e 52+ pass.

**Commit:** `feat(ux): error boundary + route-level skeletons`

### Task 11: ⚑ Review UI với Đại ca

Chụp full-page: home desktop+mobile, detail, watch, login, register, menu mobile mở → gửi Telegram (`MEDIA:`) kèm ảnh cũ đối chiếu. **Chờ Đại ca gật mới sang Phase 3.**

---

# Phase 3 — SEO & PWA & hiệu năng (P3)

### Task 12: Metadata động cho trang phim

**Files:**
- Modify: `src/app/(main)/phim/[slug]/page.tsx` — `generateMetadata`: title = tên phim, description = mô tả cắt 160 ký tự, `openGraph.images` = poster. Tương tự cho `/xem/[slug]`.

**Verify:** view-source thấy `<meta property="og:title">` đúng tên phim; e2e pass.

**Commit:** `feat(seo): dynamic metadata for film pages`

### Task 13: sitemap + robots

**Files:**
- Create: `src/app/sitemap.ts` — static routes + `/moi-cap-nhat` 5 trang đầu + phim từ 3 trang latest (cap ~120 slug, cache 1h). Base URL từ `NEXT_PUBLIC_SITE_URL` (fallback request host).
- Create: `src/app/robots.ts` — allow all, disallow `/api`, sitemap trỏ đúng.
- Modify: `.env.example` + Railway env: `NEXT_PUBLIC_SITE_URL=https://<domain-Đại-ca>` *(open question: domain chưa có thì để trống, sitemap dùng relative — Google chấp nhận khi submit qua Search Console)*.

**Verify:** `curl /sitemap.xml | head` XML hợp lệ; `/robots.txt` đúng.

**Commit:** `feat(seo): sitemap + robots`

### Task 14: PWA manifest (không service worker)

**Objective:** Cài được lên màn hình chính, icon/theme đúng brand. SW/offline = YAGNI với app streaming.

**Files:**
- Create: `src/app/manifest.ts` (Next convention) — name TonyFlix, theme `#e4f222`, background void, icon 192/512 (export PNG từ logo SVG hiện có bằng script node + sharp? → đơn giản hơn: dùng 2 file PNG đặt `public/icon-192.png`, `public/icon-512.png`, tạo bằng `resvg-js` một lần offline).
- Modify: `(main)/layout.tsx` — `themeColor` viewport export màu void/lime.

**Verify:** `curl /manifest.webmanifest` JSON hợp lệ; Lighthouse PWA installable (manifest portion).

**Commit:** `feat(pwa): web manifest + icons`

### Task 15: Lighthouse audit + fix

**Steps:** `npx lighthouse http://localhost:3987 --preset=perf --form-factor=mobile` (chạy qua script vì cần chrome — dùng chromium Playwright: `CHROME_PATH`). Target: Perf ≥ 85 mobile, A11y ≥ 90, không lỗi contrast. Fix top 3 finding thường gặp: preload hero backdrop, width/height cho img card (né CLS), font-display swap (đã có).

**Verify:** điểm trước/sau ghi vào commit message; e2e vẫn pass.

**Commit:** `perf: lighthouse fixes round 1`

---

# Phase 4 — DB bền vững (P4)

### Task 16 (optional): Drizzle migrations thay runtime ensureSchema

**Objective:** Schema versioned, không phụ thuộc bootstrap runtime.

**Files:** `drizzle.config.ts`, `drizzle/0000_init.sql` (generate), script `"db:migrate": "drizzle-kit migrate"`; giữ `ensureSchema` làm fallback an toàn (idempotent, không xoá). Chỉ bật khi Đại ca đồng ý thêm bước migrate trong deploy Railway (start command chạy migrate trước `next start`).

**Verify:** DB sạch mới → migrate tạo bảng khớp schema hiện tại; app chạy bình thường.

**Commit:** `feat(db): versioned migrations (runtime bootstrap kept as fallback)`

---

# Verification cuối cùng (Definition of Done)

1. `./scripts/e2e-with-auth.sh` → **≥ 75 pass / 0 fail** (52 baseline + favorites/watch-progress/mobile-nav/change-password/health/security specs mới).
2. `curl -I` headers security đủ; `/api/health` xanh không cookie; `/sitemap.xml`, `/manifest.webmanifest` hợp lệ.
3. Screenshot bộ UI đầy đủ (desktop + mobile) gửi Đại ca — rule "chụp trước khi xong".
4. CI GitHub Actions xanh trên main; Railway deploy thành công, smoke test production bằng `/api/health` + 1 lượt login thật.
5. Skill `movie-web-apps` được patch với trạng thái mới + pitfalls gặp phải trong quá trình upgrade.

## Risks & tradeoffs

| Rủi ro | Giảm thiểu |
|---|---|
| CSP enforce vỡ player embed | Chỉ Report-Only ở Task 3, enforce là việc sau khi quan sát |
| Rate limiter in-memory mất khi restart | Chấp nhận (single instance Railway); ghi runbook; nâng Redis chỉ khi cần |
| Upstream NguonC chết làm CI đỏ | retries=1 + chọn slug phổ biến; spec phụ thuộc dữ liệu đánh dấu rõ |
| `AUTH_SECRET` rotate văng phiên | Ghi trong runbook, rotate giờ thấp điểm |
| Vision model hay timeout | Verify UI bằng DOM assertion qua Playwright (pattern đã proven) |

## Open questions (hỏi Đại ca khi tới phase)

- Domain chính thức cho SEO/PWA? (chưa có thì bỏ Task 13 phần absolute URL)
- Có muốn Sentry/GlitchTip error tracking không? (cần tạo account — mặc định SKIPPED, logger JSON là đủ giai đoạn này)
- Bật CSP enforce sau Report-Only?
