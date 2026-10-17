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

# MongoDB 7
if ! command -v mongod >/dev/null 2>&1; then
  curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
  echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
  sudo apt-get update -y
  sudo apt-get install -y mongodb-org
  sudo systemctl enable --now mongod
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
mongod --version | head -1
