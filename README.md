# TonyFlix

[![CI](https://github.com/hungtvb/tony-flix/actions/workflows/ci.yml/badge.svg)](https://github.com/hungtvb/tony-flix/actions/workflows/ci.yml)

Xem phim online HD Vietsub — web film xịn xây trên nguồn dữ liệu mở [NguonC API](https://phim.nguonc.com), thiết kế theo style **Linear** ([styles.refero.design](https://styles.refero.design)).

## Stack

- **Next.js 15** (App Router, SSR) + **TypeScript**
- **Tailwind CSS v4** với design tokens Linear đầy đủ (`src/app/globals.css` — `@theme`)
- Nguồn dữ liệu: NguonC public API (không cần key)

## Design System

Linear "midnight precision instrument":

- Canvas `#08090a`, card `#0f1011`, viền hairline `#23252a`
- Accent duy nhất: acid-lime `#e4f222` — chỉ dùng cho CTA chính
- Inter Variable, tracking -0.022em ở heading, không bold 700+
- Radius 6/12px, spacing ladder 8/12/24/96

Chi tiết: [`DESIGN.md`](./DESIGN.md).

## Chạy local

```bash
npm install
npm run dev        # http://localhost:3000
```

Build production:

```bash
npm run build && npm start
```

## Tính năng

- Trang chủ: hero + hàng phim mới cập nhật (SSR từ `/films/phim-moi-cap-nhat`)
- Chi tiết phim: metadata, cast, danh sách tập theo server (Vietsub / Lồng tiếng)
- Xem phim: player embed theo từng tập
- Tìm kiếm: `/tim-kiem?keyword=...` qua `/films/search`
- Phân trang qua paginate của API

## API Routes (proxy)

| Route | Nguồn |
|---|---|
| `GET /api/latest?page=` | `/api/films/phim-moi-cap-nhat` |
| `GET /api/search?keyword=&page=` | `/api/films/search` |
| `GET /api/film/[slug]` | `/api/film/{slug}` |

Proxy qua server-side để tránh CORS và cache được upstream response (60s).


## Xác thực (Login)

Toàn bộ trang yêu cầu đăng nhập. Tài khoản lưu trong **PostgreSQL** (bảng `users`,
mật khẩu hash scrypt) — bảng tự tạo và seed user `admin` mặc định lần đầu chạy.

| Biến môi trường | Bắt buộc | Ý nghĩa |
|---|---|---|
| `DATABASE_URL` | khuyến nghị | Chuỗi kết nối Postgres. Thiếu thì fallback sang `AUTH_USERS` |
| `AUTH_USERS` | không | Fallback cứng: `user:pass,user2:pass2` (mặc định `admin:tonyflix`) |
| `AUTH_SECRET` | production | Khóa ký cookie phiên HMAC-SHA256 |

Người dùng tự tạo tài khoản tại `/dang-ky` (tên 3-24 ký tự chữ thường/số/gạch
dưới, mật khẩu tối thiểu 6 ký tự) — đăng ký xong tự động đăng nhập. Cần có
`DATABASE_URL`; chưa cấu hình DB thì trang đăng ký báo lỗi và tắt.

Trên Railway: thêm service **Postgres** rồi tham chiếu `${{Postgres.DATABASE_URL}}`
vào biến `DATABASE_URL` của app — schema + admin tự khởi tạo lúc chạy đầu.

Đổi mật khẩu admin:
```sql
-- hash mới (chạy node): scrypt$<salt>$<hash>
UPDATE users SET password_hash = '<hash>' WHERE id = 'admin';
```

### E2E

```bash
npm run build && PORT=3987 DATABASE_URL=... npm start &
npx playwright test
# hoặc một bước:
./scripts/e2e-with-auth.sh
```

---

## Vận hành

### Biến môi trường đầy đủ

| Biến | Bắt buộc | Ý nghĩa | Mặc định |
|---|---|---|---|
| `DATABASE_URL` | khuyến nghị | Chuỗi kết nối Postgres (`postgres://user:pass@host:5432/db`) | — |
| `AUTH_USERS` | không | Fallback cứng: `user:pass,user2:pass2` | `admin:tonyflix` |
| `AUTH_SECRET` | production | Khóa ký cookie phiên HMAC-SHA256 — **đổi ngay khi lên production** | — |
| `RATE_LIMIT_MAX` | không | Số lần thử đăng nhập sai tối đa / 15 phút / IP+user | `10` |
| `REGISTER_RATE_LIMIT_MAX` | không | Số lần đăng ký sai tối đa / 15 phút / IP | `5` |
| `RATE_LIMIT_WINDOW_MS` | không | Cửa sổ rate-limit (ms) | `900000` |

### Deploy trên Railway

1. Tạo project, thêm service **Postgres** (tự động cấp `DATABASE_URL`).
2. Link repo, set `DATABASE_URL = ${{Postgres.DATABASE_URL}}`, `AUTH_SECRET` (chuỗi
   ngẫu nhiên ≥ 32 ký tự).
3. Build + start: `npm run build` rồi `npm start` (Railway phát hiện Next.js tự động).
4. Schema + seed admin `admin/tonyflix` tự khởi tạo lần đầu app chạm DB.

### Backup & restore Postgres

```bash
# Backup
pg_dump "$DATABASE_URL" > backup.sql
# Restore (vào DB mới hoặc sạch)
psql "$DATABASE_URL" < backup.sql
```

### Health check

Railway nên ping `GET /api/health` — luôn trả HTTP 200 khi app sống, kèm
`{ "ok": true, "db": "up" | "down" | "unconfigured", "uptime": <s> }`. DB chết chỉ
làm cờ `db: down`, không kill pod.

### Rotate AUTH_SECRET

Đổi giá trị trên Railway rồi redeploy. Mọi phiên đăng nhập cũ bị văng (chấp nhận) —
nên rotate giờ thấp điểm.

### Rollback

Trên Railway: redeploy commit cũ (Deploy → Deploy previously deployed commit). Mọi
build đều qua CI xanh trước khi lên production.

---

Licensed under the MIT License.
