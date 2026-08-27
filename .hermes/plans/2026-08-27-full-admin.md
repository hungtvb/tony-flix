# TonyFlix Full Admin (Hướng 3) — Plan TDD

> Thực hiện TDD: viết spec/test TRƯỚC, chạy đỏ, rồi implement đến xanh. Mỗi task một commit.
> Quy tắc: player gác lại; không động vào iframe embed; verify bằng DOM assertion + curl thật.

**Goal:** Thêm phân quyền admin + dashboard thống kê + quản lý user + curation nội dung (Editor's picks) + cài đặt site (tên/banner/bảo trì), tất cả gate bởi cột `is_admin`.

**Stack:** Next.js 15 App Router, Tailwind v4 (theme acid-lime/void), Drizzle+Postgres, signed-cookie session (Web Crypto), Playwright e2e (baseURL :3987), local PG sống (DATABASE_URL hiện dùng).

---

## Trạng thái hiện tại (đã verify)
- `users(id pk, password_hash, created_at)` — CHƯA có `is_admin`.
- Seed `admin`/`tonyflix` (không phân biệt quyền).
- `currentUser()` trả string|null — không biết role.
- Middleware gate mọi route trừ PUBLIC_PATHS; không check admin.
- Chưa có route/page admin, chưa có bảng curated/settings.
- E2E: project `setup` login admin → `e2e/.auth/user.json`; `guest` project không login.

## Nguyên tắc
- Cột `is_admin` default FALSE; seed admin phải là TRUE. Đảm bảo `ensureSchema` + seed idempotent (ON CONFLICT DO NOTHING giữ quyền hiện tại).
- Mọi route `/admin*` + API `/api/admin*` bắt buộc: login + `isAdmin=true`, sai → 403 (API) / redirect `/` (page).
- Settings lưu dưới dạng key-value bảng `site_settings`; cache per-process 60s để homepage nhẹ.
- Bảo trì mode: middleware check settings → chặn mọi page KHÔNG public (trừ /admin + login) hiển thị banner "đang bảo trì".
- Không CRUD phim từ backend (phim từ upstream NguonC) → curation = chọn slug có sẵn.

---

## Phase A — Hạ tầng phân quyền (P0)

### Task A1: Thêm cột is_admin + seed admin là admin
- Files: `src/lib/schema.ts` (thêm `isAdmin` vào users), `src/lib/db.ts` (ensureSchema ALTER thêm cột an toàn + update admin→true nếu chưa, idempotent), `src/lib/auth.ts` (currentUser trả `{username,isAdmin}` hoặc helper `requireAdmin`).
- TDD: `e2e/db-auth.spec.ts` mở rộng — thêm test `admin có is_admin=true` (gọi API debug hoặc đọc DB). Đơn giản: API `/api/admin/me` trả `{isAdmin:true}` cho admin.
- Commit: `feat(auth): is_admin column + admin seed`

### Task A2: requireAdmin guard (API + page)
- Files: `src/lib/auth.ts` thêm `requireAdmin()` (throw/redirect); `src/middleware.ts` thêm `/admin` vào danh sách cần check (middleware chỉ check login; check is_admin trong page/layout server-side để tránh đọc DB ở edge — hoặc thêm route group `(admin)` layout server guard).
- TDD: `e2e/admin-guard.spec.ts` (guest project): truy cập `/admin` → redirect `/dang-nhap`; user thường (tạo 1 user test) → 403/redirect `/`.
- Commit: `feat(admin): requireAdmin guard`

---

## Phase B — Dashboard + Quản lý user (Hướng 1)

### Task B1: API thống kê
- Files: `src/app/api/admin/stats/route.ts` — GET tổng user, user mới 7 ngày, tổng favorites, tổng watch_progress, top 10 phim xem nhiều (group by film_slug), top users theo favorites.
- TDD: `e2e/admin-stats.spec.ts`: login admin → GET `/api/admin/stats` → 200 có `totalUsers`. User thường → 403.
- Commit: `feat(admin): stats API`

### Task B2: API quản lý user
- Files: `src/app/api/admin/users/route.ts` (GET list phân trang + search), `src/app/api/admin/users/[id]/route.ts` (DELETE xoá user + dữ liệu liên quan; PUT reset mật khẩu về mặc định `tonyflix`). Không cho xoá/reset chính mình.
- TDD: `e2e/admin-users.spec.ts`: admin tạo user test qua đăng ký → list thấy → reset pass → đăng nhập pass mới OK → xoá → list không còn.
- Commit: `feat(admin): user management API`

### Task B3: Trang admin layout + dashboard
- Files: `src/app/(admin)/layout.tsx` (sidebar: Dashboard, Users, Nội dung, Cài đặt; guard server-side), `src/app/(admin)/page.tsx` (cards thống kê + bảng top phim/users).
- TDD: `e2e/admin-dashboard.spec.ts`: admin vào `/admin` thấy "Tổng người dùng" + số; user thường redirect.
- Commit: `feat(admin): dashboard page`

### Task B4: Trang quản lý user
- Files: `src/app/(admin)/users/page.tsx` (bảng user, nút reset/xoá với confirm), client component gọi API.
- TDD: `e2e/admin-users-page.spec.ts`: admin thấy bảng, reset 1 user → toast; xoá → row biến.
- Commit: `feat(admin): users management page`

---

## Phase C — Curation nội dung (Hướng 2)

### Task C1: Bảng curated + API
- Files: `src/lib/schema.ts` thêm `curatedFilms(slug pk, title, poster, note, position, created_at)`; `src/lib/db.ts` ensure; `src/app/api/admin/curated/route.ts` (GET list, POST thêm/upsert, DELETE). API lấy title/poster từ nguonc.ts nếu chưa có.
- TDD: `e2e/admin-curated-api.spec.ts`: admin POST slug hợp lệ → GET thấy; DELETE → không còn. User thường 403.
- Commit: `feat(admin): curated films API`

### Task C2: Trang curation + homepage hiển thị
- Files: `src/app/(admin)/content/page.tsx` (thêm/xoá phim nổi bật, kéo đổi vị trí đơn giản bằng input number); `src/lib/curated.ts` (hàm đọc curated có cache); sửa `src/app/(main)/page.tsx` chèn hàng "Được chọn cho bạn" đầu trang khi có dữ liệu.
- TDD: `e2e/admin-curated-page.spec.ts` + `e2e/home-curated.spec.ts`: admin thêm slug → home có hàng curated đúng poster; xoá → home hết hàng.
- Commit: `feat(admin): curated content page + homepage row`

---

## Phase D — Cài đặt site (Hướng 3)

### Task D1: Bảng site_settings + API
- Files: `src/lib/schema.ts` thêm `siteSettings(key pk, value, updated_at)`; `src/lib/settings.ts` (getSetting/setSetting + cache 60s); `src/app/api/admin/settings/route.ts` (GET/PUT site_name, banner_text, maintenance_mode).
- TDD: `e2e/admin-settings-api.spec.ts`: admin PUT maintenance_mode=true → GET thấy; user thường 403.
- Commit: `feat(admin): site settings API`

### Task D2: Áp dụng settings
- Files: `src/app/(main)/layout.tsx` đọc site_name vào <title>/header nhỏ; banner_text hiển thị top-of-page khi có; `src/middleware.ts` (hoặc layout) check maintenance_mode → nếu bật, mọi page không phải /admin/login → hiển thị trang bảo trì (component `src/components/maintenance.tsx`). Admin vẫn vào được.
- TDD: `e2e/admin-maintenance.spec.ts`: bật bảo trì → user thường vào `/` thấy "đang bảo trì"; admin vào `/admin` vẫn bình thường; tắt → user vào `/` bình thường.
- Commit: `feat(admin): apply site name/banner/maintenance`

### Task D3: Trang cài đặt
- Files: `src/app/(admin)/settings/page.tsx` (form tên web, banner, toggle bảo trì).
- TDD: `e2e/admin-settings-page.spec.ts`: admin đổi tên web → header/title đổi; toggle bảo trì → hiệu lực.
- Commit: `feat(admin): settings page`

---

## Phase E — UX + Verify

### Task E1: Link admin trên navbar (chỉ admin thấy)
- Files: `src/components/navbar.tsx` + `user-menu.tsx` hiện link "Quản trị" khi `isAdmin`.
- TDD: `e2e/navbar-admin-link.spec.ts`: admin thấy link; user thường không.
- Commit: `feat(admin): navbar admin link`

### Task E2: Screenshot review
- Chụp: /admin dashboard, /admin/users, /admin/content, /admin/settings, homepage có hàng curated, maintenance mode. Gửi Đại ca.

---

## Definition of Done
1. `npm run build` pass.
2. E2E: toàn bộ suite xanh (thêm ~10 spec admin), trong đó admin flow xanh, user-thường/guest bị chặn đúng.
3. curl thực tế: `/api/admin/stats` trả JSON có số; maintenance toggle có hiệu lực thật.
4. Bộ screenshot gửi Đại ca duyệt.
5. Commit từng task, push main → Railway deploy xanh.

## Risks
- ALTER COLUMN chạy trên Railway PG cũ: dùng `ADD COLUMN IF NOT EXISTS` + update admin idempotent → an toàn.
- Middleware không đọc DB (edge) → check is_admin trong server layout/page guard, không ở middleware.
- Cache settings 60s → đổi bảo trì có độ trễ tối đa 60s; chấp nhận, ghi note.
- Curated poster lấy từ upstream → fail mềm nếu slug sai.
