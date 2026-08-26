#!/usr/bin/env bash
# Build + start server với env e2e (Postgres nếu có DATABASE_URL), chạy Playwright, dọn sạch.
set -euo pipefail
cd "$(dirname "$0")/.."

export AUTH_USERS="${AUTH_USERS:-admin:tonyflix}"
export AUTH_SECRET="${AUTH_SECRET:-e2e-secret-tonyflix}"
export E2E_DB_USER="${E2E_DB_USER:-dbonly}"
export E2E_DB_PASS="${E2E_DB_PASS:-dbpass123}"

# Seed user chỉ-tồn-tại-trong-DB cho e2e/db-auth.spec.ts (bỏ qua nếu không có DATABASE_URL)
if [[ -n "${DATABASE_URL:-}" ]] && command -v psql >/dev/null 2>&1; then
  HASH=$(node -e "
    const { scryptSync, randomBytes } = require('node:crypto')
    const salt = randomBytes(16)
    console.log('scrypt\$' + salt.toString('hex') + '\$' + scryptSync(process.env.E2E_DB_PASS, salt, 64).toString('hex'))
  ")
  psql "$DATABASE_URL" -c "INSERT INTO users (id, password_hash) VALUES ('$E2E_DB_USER', '$HASH') ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;" || true
fi

npm run build
PORT=3987 npm start &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT

for i in $(seq 1 30); do
  if curl -s -o /dev/null "http://localhost:3987/dang-nhap"; then break; fi
  sleep 1
done

BASE_URL=http://localhost:3987 npx playwright test "$@"
