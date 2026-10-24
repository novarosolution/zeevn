#!/usr/bin/env bash
# Run ONCE on a fresh Ubuntu EC2 as ubuntu user (via SSH).
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive
APP_DIR=/var/www/zeevan
REPO=https://github.com/novarosolution/zeevn.git

sudo apt-get update -y
sudo apt-get install -y curl git nginx ca-certificates gnupg build-essential

# Node 20
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# Docker + Mongo (Ubuntu 26: official mongodb-org packages lag)
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker ubuntu || true
fi
sudo systemctl enable --now docker
if ! sudo docker ps -a --format '{{.Names}}' | grep -qx zeevan-mongo; then
  sudo docker run -d --name zeevan-mongo --restart unless-stopped \
    --memory=320m --memory-swap=640m \
    -p 127.0.0.1:27017:27017 -v zeevan-mongo-data:/data/db \
    mongo:7 --wiredTigerCacheSizeGB 0.25 --bind_ip_all
else
  sudo docker start zeevan-mongo || true
fi

sudo npm install -g pm2

sudo mkdir -p "$APP_DIR"
sudo chown -R ubuntu:ubuntu "$APP_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO" "$APP_DIR"
else
  cd "$APP_DIR" && git fetch origin && git reset --hard origin/main
fi

mkdir -p "$APP_DIR/web" "$APP_DIR/backend"

# nginx site
sudo cp "$APP_DIR/deploy/nginx-zeevan.conf" /etc/nginx/sites-available/zeevan
sudo ln -sfn /etc/nginx/sites-available/zeevan /etc/nginx/sites-enabled/zeevan
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx

# open firewall if ufw active
if command -v ufw >/dev/null 2>&1 && sudo ufw status | grep -q active; then
  sudo ufw allow OpenSSH
  sudo ufw allow 80/tcp
  sudo ufw allow 5001/tcp
fi

echo "Bootstrap done. Copy backend/.env then: cd $APP_DIR/backend && npm ci --omit=dev && pm2 start ecosystem.config.cjs"
node -v
npm -v
sudo docker ps --filter name=zeevan-mongo --format '{{.Names}} {{.Status}}'
