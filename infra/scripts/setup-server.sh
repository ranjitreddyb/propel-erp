#!/bin/bash
# ============================================================
# PropelERP — One-Command Server Setup Script
# Run this on your fresh Ubuntu 22.04 VPS as root:
# curl -sSL https://raw.githubusercontent.com/YOUR_ORG/propel-erp/main/infra/scripts/setup-server.sh | bash
# ============================================================

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

log()  { echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"; }
info() { echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ  $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠  $1${NC}"; }
err()  { echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"; exit 1; }

echo ""
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   PropelERP — Server Setup Script    ║${NC}"
echo -e "${BLUE}║   propelerp.wisewit.ai               ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

# ─── Check root ───────────────────────────────────────────
[[ $EUID -ne 0 ]] && err "This script must be run as root. Use: sudo bash setup-server.sh"

# ─── Get inputs ───────────────────────────────────────────
read -p "Enter your GitHub repository URL (e.g. https://github.com/ORG/propel-erp): " REPO_URL
read -p "Enter your domain (e.g. propel.wisewit.ai): " DOMAIN
read -p "Enter your email for SSL certificate: " SSL_EMAIL
read -s -p "Enter a strong DB password: " DB_PASS; echo ""
read -s -p "Enter a JWT secret (32+ chars): " JWT_SECRET; echo ""

# ─── 1. System update ─────────────────────────────────────
info "Updating system packages…"
apt-get update -qq && apt-get upgrade -y -qq
log "System updated"

# ─── 2. Install Docker ────────────────────────────────────
info "Installing Docker…"
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  usermod -aG docker ubuntu 2>/dev/null || true
  log "Docker installed"
else
  log "Docker already installed ($(docker --version))"
fi

# ─── 3. Install Docker Compose v2 ─────────────────────────
info "Installing Docker Compose…"
apt-get install -y -qq docker-compose-plugin
log "Docker Compose installed"

# ─── 4. Install system tools ──────────────────────────────
info "Installing system tools…"
apt-get install -y -qq git nginx certbot python3-certbot-nginx ufw curl wget unzip
log "System tools installed"

# ─── 5. Configure firewall ────────────────────────────────
info "Configuring firewall…"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
log "Firewall configured (SSH, HTTP, HTTPS)"

# ─── 6. Add swap (prevents OOM on small servers) ──────────
info "Setting up 4GB swap…"
if [ ! -f /swapfile ]; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  log "Swap created"
fi

# ─── 7. Clone repository ──────────────────────────────────
info "Cloning PropelERP repository…"
mkdir -p /opt/propel-erp
cd /opt/propel-erp
if [ -d ".git" ]; then
  git pull origin main
  log "Repository updated"
else
  git clone "$REPO_URL" .
  log "Repository cloned"
fi

# ─── 8. Create .env file ──────────────────────────────────
info "Creating environment configuration…"
cat > /opt/propel-erp/.env << ENVEOF
NODE_ENV=production
APP_URL=https://${DOMAIN}
API_URL=https://${DOMAIN}
AI_ENGINE_URL=http://ai-engine:8000

DATABASE_URL=postgresql://propel_user:${DB_PASS}@postgres:5432/propel_erp
DB_HOST=postgres
DB_PORT=5432
DB_NAME=propel_erp
DB_USER=propel_user
DB_PASSWORD=${DB_PASS}

REDIS_URL=redis://redis:6379
MONGODB_URI=mongodb://mongodb:27017/propel_docs

JWT_SECRET=${JWT_SECRET}
NEXTAUTH_SECRET=${JWT_SECRET}
NEXTAUTH_URL=https://${DOMAIN}
JWT_EXPIRES_IN=7d

AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=REPLACE_WITH_YOUR_KEY
AWS_SECRET_ACCESS_KEY=REPLACE_WITH_YOUR_SECRET
AWS_S3_BUCKET=propel-erp-documents

SENDGRID_API_KEY=REPLACE_WITH_SENDGRID_KEY
EMAIL_FROM=noreply@wisewit.ai

MSG91_AUTH_KEY=REPLACE_WITH_MSG91_KEY
MSG91_SENDER_ID=PROPEL

OPENAI_API_KEY=REPLACE_WITH_OPENAI_KEY
ANTHROPIC_API_KEY=REPLACE_WITH_ANTHROPIC_KEY

ENABLE_AI_MODULE=true
ENABLE_SMS=true
ENABLE_EMAIL=true
ENVEOF
chmod 600 /opt/propel-erp/.env
log ".env file created (remember to update API keys!)"

# ─── 9. SSL Certificate ───────────────────────────────────
info "Obtaining SSL certificate for ${DOMAIN}…"
systemctl stop nginx 2>/dev/null || true
if certbot certonly --standalone --non-interactive --agree-tos \
   -m "$SSL_EMAIL" -d "$DOMAIN" 2>/dev/null; then
  log "SSL certificate obtained for ${DOMAIN}"
else
  warn "SSL cert failed — DNS may not be pointing to this server yet"
  warn "Run manually later: certbot certonly --standalone -d ${DOMAIN} -m ${SSL_EMAIL}"
fi

# ─── 10. Configure Nginx ──────────────────────────────────
info "Configuring Nginx…"
cp /opt/propel-erp/infra/nginx/nginx.conf /etc/nginx/nginx.conf
# Replace domain placeholder if any
sed -i "s/propelerp.wisewit.ai/${DOMAIN}/g" /etc/nginx/nginx.conf
systemctl restart nginx 2>/dev/null || true
log "Nginx configured"

# ─── 11. Setup auto-renewal for SSL ───────────────────────
info "Setting up auto SSL renewal…"
(crontab -l 2>/dev/null; echo "0 12 * * * certbot renew --quiet && docker compose -f /opt/propel-erp/docker-compose.yml restart nginx") | crontab -
log "SSL auto-renewal scheduled"

# ─── 12. Start services ───────────────────────────────────
info "Building and starting Docker services…"
cd /opt/propel-erp
docker compose pull 2>/dev/null || true
docker compose up -d --build
log "Docker services started"

# ─── 13. Wait for DB and run migrations ───────────────────
info "Waiting for database to be ready…"
sleep 20
docker compose exec -T postgres pg_isready -U propel_user -d propel_erp && \
  docker compose exec -T backend npm run db:migrate && \
  docker compose exec -T backend npm run db:seed && \
  log "Database migrated and seeded" || \
  warn "DB migration failed — run manually: docker compose exec backend npm run db:migrate"

# ─── 14. Setup log rotation ───────────────────────────────
cat > /etc/logrotate.d/propel-erp << 'LOGEOF'
/opt/propel-erp/logs/*.log {
  daily
  rotate 14
  compress
  missingok
  notifempty
  sharedscripts
  postrotate
    docker compose -f /opt/propel-erp/docker-compose.yml restart backend
  endscript
}
LOGEOF

# ─── 15. Setup systemd auto-start ────────────────────────
cat > /etc/systemd/system/propel-erp.service << 'SVCEOF'
[Unit]
Description=PropelERP Docker Compose
Requires=docker.service
After=docker.service network.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/propel-erp
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable propel-erp
log "PropelERP configured to start on boot"

# ─── Done ─────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         🎉 PropelERP Setup Complete!             ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  URL:      https://${DOMAIN}           ║${NC}"
echo -e "${GREEN}║  Login:    admin@wisewit.ai                      ║${NC}"
echo -e "${GREEN}║  Password: PropelAdmin@2026                      ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════╣${NC}"
echo -e "${YELLOW}║  ⚠️  IMPORTANT: Update .env with real API keys!   ║${NC}"
echo -e "${YELLOW}║  Edit: nano /opt/propel-erp/.env                 ║${NC}"
echo -e "${YELLOW}║  Then: docker compose restart                    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  docker compose -f /opt/propel-erp/docker-compose.yml ps"
echo "  docker compose -f /opt/propel-erp/docker-compose.yml logs -f backend"
echo "  docker compose -f /opt/propel-erp/docker-compose.yml restart"
echo "  curl https://${DOMAIN}/health"
