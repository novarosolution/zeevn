#!/usr/bin/env bash
# Install and wire YouPI-PG on the Zeevan EC2 host. Idempotent.
set -euo pipefail

YOUPI_DIR="${YOUPI_DIR:-/var/www/youpi-pg}"
ZEEVAN_DIR="${ZEEVAN_DIR:-/var/www/zeevan}"
MERCHANT_ID="00000000-0000-0000-0000-000000000001"
VPA="${UPI_COLLECT_VPA:-8320631598@ybl}"
PAYEE="${UPI_COLLECT_PAYEE:-Zeevan}"
WEBHOOK="http://127.0.0.1:5001/api/orders/youpi-webhook"

ensure_kv() {
  local file="$1" key="$2" value="$3"
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    return 0
  fi
  printf '%s=%s\n' "$key" "$value" >> "$file"
}

set_kv() {
  local file="$1" key="$2" value="$3"
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    perl -i -pe "s|^${key}=.*|${key}=${value}|" "$file"
  else
    printf '%s=%s\n' "$key" "$value" >> "$file"
  fi
}

if ! swapon --show | grep -q .; then
  sudo fallocate -l 2G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
fi
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=256}"

sudo mkdir -p "$YOUPI_DIR"
sudo chown -R "$(id -un):$(id -gn)" "$YOUPI_DIR"
if [ ! -d "$YOUPI_DIR/.git" ]; then
  git clone --depth 1 https://github.com/youpi-pg/YouPI-PG.git "$YOUPI_DIR"
fi

cd "$YOUPI_DIR"

if [ ! -f .env ]; then
  TOKEN="$(openssl rand -hex 24)"
  cat > .env <<EOF
NODE_ENV=production
YOUPI_MODE=localhost
YOUPI_ALLOW_LOCALHOST_MODE=true
YOUPI_ALLOW_PRIVATE_WEBHOOKS=true
YOUPI_BIND_HOST=127.0.0.1
PAYMENT_API_PORT=6100
CHECKOUT_PORTAL_PORT=7000
MERCHANT_ADMIN_PORT=6001
BASE_PAYMENT_API_URL=http://127.0.0.1:6100
BASE_CHECKOUT_URL=https://www.zeevan.shop/pay
BASE_ADMIN_URL=https://www.zeevan.shop/youpi-admin
USE_SQLITE_FALLBACK=true
SQLITE_DB_PATH=./data/youpi_pg.sqlite
ENCRYPTION_MASTER_KEY=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)
ADMIN_API_TOKEN=$TOKEN
CHECKOUT_FRAME_ANCESTORS=https://www.zeevan.shop https://zeevan.shop
EOF
  chmod 600 .env
else
  ensure_kv .env YOUPI_ALLOW_PRIVATE_WEBHOOKS true
  ensure_kv .env YOUPI_ALLOW_LOCALHOST_MODE true
  ensure_kv .env YOUPI_MODE localhost
  ensure_kv .env YOUPI_BIND_HOST 127.0.0.1
  ensure_kv .env BASE_PAYMENT_API_URL http://127.0.0.1:6100
  ensure_kv .env BASE_CHECKOUT_URL https://www.zeevan.shop/pay
  ensure_kv .env BASE_ADMIN_URL https://www.zeevan.shop/youpi-admin
  ensure_kv .env USE_SQLITE_FALLBACK true
  ensure_kv .env ADMIN_API_TOKEN "$(openssl rand -hex 24)"
fi

if [ ! -d node_modules ]; then
  npm_config_engine_strict=false npm install --omit=dev
fi

mkdir -p data
if [ ! -f data/youpi_pg.sqlite ]; then
  npm_config_engine_strict=false npm run db:setup
fi

pm2 startOrReload "$ZEEVAN_DIR/deploy/youpi.ecosystem.cjs" --update-env
pm2 save

ok=0
for _ in $(seq 1 20); do
  if curl -sf -m 3 http://127.0.0.1:6100/health >/dev/null && curl -sf -m 3 http://127.0.0.1:6001/health >/dev/null; then
    ok=1
    break
  fi
  sleep 2
done
if [ "$ok" != 1 ]; then
  echo "YouPI health check failed" >&2
  pm2 logs youpi-api --lines 40 --nostream || true
  exit 1
fi

TOKEN="$(awk -F= '/^ADMIN_API_TOKEN=/{print substr($0,index($0,"=")+1); exit}' .env)"

python3 - "$TOKEN" "$MERCHANT_ID" "$VPA" "$PAYEE" "$WEBHOOK" <<'PY'
import json, sys, urllib.request
token, merchant_id, vpa, payee, webhook = sys.argv[1:6]
body = {
    "merchantId": merchant_id,
    "businessName": "Zeevan",
    "upiId": vpa,
    "payeeName": payee,
    "webhookUrl": webhook,
    "sellingMode": "ONLINE",
    "enabledPaymentMethods": ["UPI"],
    "branding": {
        "appName": "Zeevan",
        "hidePoweredBy": True,
        "sellingMode": "ONLINE",
        "enabledPaymentMethods": ["UPI"],
    },
}
req = urllib.request.Request(
    "http://127.0.0.1:6100/api/v1/admin/all-settings",
    data=json.dumps(body).encode(),
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Merchant-Id": merchant_id,
    },
    method="POST",
)
with urllib.request.urlopen(req, timeout=15) as res:
    data = json.load(res)
print(data.get("webhookSecret") or "")
print(data.get("merchantId") or merchant_id)
print(data.get("upiId") or vpa)
PY

SETTINGS="$(python3 - "$TOKEN" "$MERCHANT_ID" <<'PY'
import json, sys, urllib.request
token, merchant_id = sys.argv[1:3]
req = urllib.request.Request(
    "http://127.0.0.1:6100/api/v1/admin/all-settings",
    headers={"Authorization": f"Bearer {token}", "X-Merchant-Id": merchant_id},
)
with urllib.request.urlopen(req, timeout=15) as res:
    print(json.dumps(json.load(res)))
PY
)"

WEBHOOK_SECRET="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1]).get("webhookSecret") or "")' "$SETTINGS")"
LIVE_VPA="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1]).get("upiId") or "")' "$SETTINGS")"
echo "YouPI merchant VPA=${LIVE_VPA}"

BACKEND_ENV="$ZEEVAN_DIR/backend/.env"
touch "$BACKEND_ENV"
set_kv "$BACKEND_ENV" YOUPI_API_URL "http://127.0.0.1:6100"
set_kv "$BACKEND_ENV" YOUPI_MERCHANT_ID "$MERCHANT_ID"
if [ -n "$WEBHOOK_SECRET" ]; then
  set_kv "$BACKEND_ENV" YOUPI_WEBHOOK_SECRET "$WEBHOOK_SECRET"
fi
set_kv "$BACKEND_ENV" YOUPI_RETURN_URL "https://www.zeevan.shop/orders"
set_kv "$BACKEND_ENV" UPI_COLLECT_VPA "$VPA"
set_kv "$BACKEND_ENV" UPI_COLLECT_PAYEE "$PAYEE"

pm2 restart zeevan-api
echo "YouPI admin: https://www.zeevan.shop/youpi-admin/"
echo "YouPI login uses ADMIN_API_TOKEN from $YOUPI_DIR/.env"
