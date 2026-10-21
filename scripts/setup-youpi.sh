#!/usr/bin/env bash
# Install YouPI-PG next to Zeevan and write a starter .env (PDF sections 4–5).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${YOUPI_DIR:-$ROOT/../youpi-pg}"
NODE_BIN="${NODE_BIN:-node}"

if [ ! -d "$DEST/.git" ]; then
  git clone https://github.com/youpi-pg/YouPI-PG.git "$DEST"
fi
cd "$DEST"
npm install
if [ ! -f .env ]; then
  cp .env.example .env
  ENC="$($NODE_BIN -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
  JWT="$($NODE_BIN -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
  perl -i -pe "s/^ENCRYPTION_MASTER_KEY=.*/ENCRYPTION_MASTER_KEY=$ENC/" .env || true
  perl -i -pe "s/^JWT_SECRET=.*/JWT_SECRET=$JWT/" .env || true
  grep -q '^NODE_ENV=' .env || echo "NODE_ENV=development" >> .env
  grep -q '^BASE_PAYMENT_API_URL=' .env || echo "BASE_PAYMENT_API_URL=http://127.0.0.1:6100" >> .env
  grep -q '^BASE_CHECKOUT_URL=' .env || echo "BASE_CHECKOUT_URL=http://127.0.0.1:7000" >> .env
fi
echo "YouPI is in $DEST"
echo "Start: cd $DEST && npm run dev"
echo "Then open http://localhost:6001 — set UPI, copy merchant id + webhook secret into backend/.env"
echo "  YOUPI_API_URL=http://127.0.0.1:7000"
echo "  YOUPI_MERCHANT_ID=..."
echo "  YOUPI_WEBHOOK_SECRET=..."
echo "  YOUPI_RETURN_URL=https://www.zeevan.shop/orders"
echo "Webhook URL in YouPI admin: https://www.zeevan.shop/aws/api/orders/youpi-webhook"
