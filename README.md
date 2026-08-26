# TonyFlix

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

Licensed under the MIT License.
