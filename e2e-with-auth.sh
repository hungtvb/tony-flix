#!/usr/bin/env bash
# Chạy e2e tony-flix với rate limit nới lỏng (tránh 429 khi đăng ký nhiều user test song song).
# Server phải đang chạy tại PORT (mặc định 3987) và có DATABASE_URL.
set -euo pipefail

PORT="${PORT:-3987}"
export PORT
# Nới rate limit cho CI / local e2e
export RATE_LIMIT_MAX="${RATE_LIMIT_MAX:-200}"
export REGISTER_RATE_LIMIT_MAX="${REGISTER_RATE_LIMIT_MAX:-200}"
export RATE_LIMIT_WINDOW_MS="${RATE_LIMIT_WINDOW_MS:-600000}"

echo "▶ Running e2e against http://localhost:${PORT} (rate limits relaxed)"
npx playwright test "$@"
