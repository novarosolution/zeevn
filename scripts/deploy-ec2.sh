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
scp_cmd "$ROOT/backend/.env" "$USER@$HOST:$APP_DIR/backend/.env"
ssh_cmd "cd $APP_DIR/backend && npm ci --omit=dev && pm2 startOrReload ecosystem.config.cjs --only zeevan-api || pm2 start server.js --name zeevan-api && pm2 save"

echo "==> Upload web dist"
ssh_cmd "mkdir -p $APP_DIR/web"
rsync -az --delete -e "ssh -i $KEY -o StrictHostKeyChecking=accept-new" \
  "$ROOT/mobile/dist/" "$USER@$HOST:$APP_DIR/web/"

echo "==> Reload nginx"
ssh_cmd "sudo nginx -t && sudo systemctl reload nginx"
echo "Done. Web: http://$HOST  API: http://$HOST:5001"
