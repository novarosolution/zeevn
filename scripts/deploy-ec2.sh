#!/usr/bin/env bash
# Deploy Zeevan API + web to EC2 (run from laptop after SSH key is ready).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${EC2_HOST:-54.173.67.136}"
USER="${EC2_USER:-ubuntu}"
KEY="${EC2_KEY:-$ROOT/zeevan.pem}"
APP_DIR="/var/www/zeevan"

ssh_cmd() { ssh -i "$KEY" -o StrictHostKeyChecking=accept-new "$USER@$HOST" "$@"; }
scp_cmd() { scp -i "$KEY" -o StrictHostKeyChecking=accept-new "$@"; }

echo "==> Syncing repo on server"
ssh_cmd "sudo mkdir -p $APP_DIR && sudo chown -R $USER:$USER $APP_DIR"
ssh_cmd "if [ -d $APP_DIR/.git ]; then cd $APP_DIR && git fetch origin && git reset --hard origin/main; else git clone https://github.com/novarosolution/zeevn.git $APP_DIR; fi"

echo "==> Backend deps + restart"
if [ "${DEPLOY_OVERWRITE_ENV:-}" = "1" ]; then
  scp_cmd "$ROOT/backend/.env" "$USER@$HOST:$APP_DIR/backend/.env"
else
  echo "Keeping server backend/.env (set DEPLOY_OVERWRITE_ENV=1 to replace it)"
fi
ssh_cmd "cd $APP_DIR/backend && npm ci --omit=dev && pm2 startOrReload ecosystem.config.cjs --only zeevan-api || pm2 start server.js --name zeevan-api && pm2 save"

echo "==> Upload web dist"
if [ -d "$ROOT/mobile/dist" ]; then
  ssh_cmd "mkdir -p $APP_DIR/web"
  rsync -az --delete -e "ssh -i $KEY -o StrictHostKeyChecking=accept-new" \
    "$ROOT/mobile/dist/" "$USER@$HOST:$APP_DIR/web/"
else
  echo "Skipping web dist (mobile/dist missing — Vercel serves zeevan.shop)"
fi

echo "==> Install nginx site (API + /media proxy)"
scp_cmd "$ROOT/deploy/nginx-zeevan.conf" "$USER@$HOST:/tmp/nginx-zeevan.conf"
ssh_cmd "sudo cp /tmp/nginx-zeevan.conf /etc/nginx/sites-available/zeevan && sudo ln -sfn /etc/nginx/sites-available/zeevan /etc/nginx/sites-enabled/zeevan && sudo rm -f /etc/nginx/sites-enabled/default && sudo nginx -t && sudo systemctl reload nginx"
echo "Done. Web: http://$HOST  API: http://$HOST:5001"
