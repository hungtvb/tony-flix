#!/usr/bin/env bash
#
# start.sh — idempotent launcher for tony-flix (Next.js).
#
# Port 3987 is the app's standard port (see e2e-with-auth.sh, playwright.config.ts).
#
# Behaviour (idempotent):
#   1. Probe $PORT (default 3987). If ALREADY bound -> NO-OP and exit 0.
#      This deliberately breaks any downstream `exit 1` chain: re-running the
#      script when the server is already up is SUCCESS, never an
#      "address already in use" failure.
#   2. Otherwise run $START_CMD (default: `npm start` with PORT exported),
#      wait until the port is actually LISTENing, and record the PID.
#
# NOTE: intentionally NOT `set -e` — the "already running" branch must exit 0
# cleanly so it cannot abort a caller's chained command.
#
set -uo pipefail

PORT="${PORT:-3987}"
HOST="${HOST:-127.0.0.1}"
START_CMD="${START_CMD:-npm start}"
PIDFILE="${PIDFILE:-.start.${PORT}.pid}"
LOGFILE="${LOGFILE:-.start.${PORT}.log}"
READY_TIMEOUT="${READY_TIMEOUT:-30}"   # seconds to wait for the port to come up

# Pass-through env so the server gets DB / auth / rate-limit config.
export PORT
[[ -n "${DATABASE_URL:-}" ]]   && export DATABASE_URL
[[ -n "${AUTH_SECRET:-}" ]]   && export AUTH_SECRET
[[ -n "${AUTH_USERS:-}" ]]    && export AUTH_USERS

die() { echo "start.sh: ERROR: $*" >&2; exit 1; }

# --- validate inputs -------------------------------------------------------
command -v bash >/dev/null 2>&1 || die "bash is required"

# --- port probe; returns 0=in-use, 1=free ----------------------------------
# Prefer the kernel listening table (/proc/net/tcp), then a real connect,
# then ss/netstat as a last resort.
hexport() { printf '%04X' "$1"; }

port_in_use() {
  local hp; hp=$(hexport "$PORT")
  if [[ -r /proc/net/tcp ]] && grep -qi " 0100007F:${hp} " /proc/net/tcp 2>/dev/null; then
    return 0
  fi
  if [[ -r /proc/net/tcp6 ]] && grep -qi " 00000000000000000000000000000000:${hp} " /proc/net/tcp6 2>/dev/null; then
    return 0
  fi
  if (command exec 3<>"/dev/tcp/${HOST}/${PORT}") 2>/dev/null; then
    return 0
  fi
  if command -v ss >/dev/null 2>&1; then
    ss -ltn 2>/dev/null | awk '{print $4}' | grep -Eq "[:.]${PORT}\$" && return 0
  fi
  if command -v netstat >/dev/null 2>&1; then
    netstat -ltn 2>/dev/null | awk '{print $4}' | grep -Eq "[:.]${PORT}\$" && return 0
  fi
  return 1
}

# --- already running? NO-OP + exit 0 (key fix) -----------------------------
if port_in_use; then
  echo "start.sh: port ${HOST}:${PORT} already bound — tony-flix already running, skipping start (no-op)."
  [[ -f "$PIDFILE" ]] && echo "start.sh: pidfile: $(cat "$PIDFILE" 2>/dev/null)"
  exit 0
fi

# --- launch ----------------------------------------------------------------
echo "start.sh: starting tony-flix on ${HOST}:${PORT} (cmd: ${START_CMD}) ..."
nohup bash -c "$START_CMD" >>"$LOGFILE" 2>&1 &
PID=$!
echo "$PID" >"$PIDFILE"
echo "start.sh: launched pid=$PID (log: $LOGFILE)"

# --- wait for readiness (verify real bind, don't fail blind) ---------------
elapsed=0
while ! port_in_use; do
  if ! kill -0 "$PID" 2>/dev/null; then
    die "process $PID exited before binding ${HOST}:${PORT} (see $LOGFILE)"
  fi
  sleep 0.5
  elapsed=$((elapsed + 1))
  if (( elapsed >= READY_TIMEOUT * 2 )); then
    die "timed out after ${READY_TIMEOUT}s waiting for ${HOST}:${PORT} (see $LOGFILE)"
  fi
done

echo "start.sh: READY — tony-flix up at http://${HOST}:${PORT} (pid=$PID)"
exit 0
