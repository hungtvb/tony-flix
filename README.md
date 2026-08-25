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

---

Licensed under the MIT License.
