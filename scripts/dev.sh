#!/usr/bin/env sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${EXPO_WEB_PORT:-8082}"

cd "$ROOT"
npm run backend:dev &
BACKEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

sleep 2
cd "$ROOT/mobile"
exec npx expo start --web --port "$PORT"
