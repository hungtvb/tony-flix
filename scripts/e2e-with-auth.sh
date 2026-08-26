#!/usr/bin/env bash
# Build + start server với env e2e, chạy Playwright, dọn sạch.
set -euo pipefail
cd "$(dirname "$0")"

export AUTH_USERS="${AUTH_USERS:-admin:tonyflix}"
export AUTH_SECRET="${AUTH_SECRET:-e2e-secret-tonyflix}"

npm run build
PORT=3987 npm start &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT

for i in $(seq 1 30); do
  if curl -s -o /dev/null "http://localhost:3987/dang-nhap"; then break; fi
  sleep 1
done

BASE_URL=http://localhost:3987 npx playwright test "$@"
