#!/bin/bash
# ============================================================
# PropelERP — Production Deployment Script for OCI VM
# Domain: propelerp.wisewit.ai
# IP: 129.159.232.247
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"; }
info() { echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ  $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠  $1${NC}"; }
err()  { echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"; exit 1; }

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   PropelERP — OCI Production Deployment           ║${NC}"
echo -e "${BLUE}║   propelerp.wisewit.ai                            ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# ─── Check if running as root ──────────────────────────────
[[ $EUID -ne 0 ]] && err "Run as root: sudo bash deploy-oci.sh"

# ─── Configuration ─────────────────────────────────────────
DOMAIN="propelerp.wisewit.ai"
REPO_URL="https://github.com/ranjitreddyb/propel-erp.git"
DEPLOY_DIR="/opt/propel-erp"
SSL_EMAIL="admin@wisewit.ai"

# ─── Generate secure passwords ─────────────────────────────
info "Generating secure credentials..."
DB_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
JWT_SECRET=$(openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 48)
NEXTAUTH_SECRET=$(openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 48)
log "Credentials generated"

# ─── 1. Update system ──────────────────────────────────────
info "Updating system packages..."
apt-get update -qq && apt-get upgrade -y -qq
log "System updated"

# ─── 2. Install Docker (if not present) ───────────────────
info "Checking Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  log "Docker installed"
else
  log "Docker already installed ($(docker --version))"
fi

# ─── 3. Install Docker Compose v2 ──────────────────────────
info "Installing Docker Compose..."
apt-get install -y -qq docker-compose-plugin
log "Docker Compose installed"

# ─── 4. Install required packages ──────────────────────────
info "Installing required packages..."
apt-get install -y -qq git certbot ufw curl wget
log "Packages installed"

# ─── 5. Configure firewall ─────────────────────────────────
info "Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
log "Firewall configured (SSH, HTTP, HTTPS only)"

# ─── 6. Add swap (if not exists) ───────────────────────────
info "Checking swap..."
if [ ! -f /swapfile ]; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  log "4GB swap created"
else
  log "Swap already exists"
fi

# ─── 7. Clone/update repository ────────────────────────────
info "Setting up repository..."
mkdir -p $DEPLOY_DIR
cd $DEPLOY_DIR

if [ -d ".git" ]; then
  git fetch origin main
  git reset --hard origin/main
  log "Repository updated"
else
  git clone $REPO_URL .
  log "Repository cloned"
fi

# ─── 8. Create production .env ─────────────────────────────
info "Creating production environment file..."
cat > $DEPLOY_DIR/.env << ENVEOF
# PropelERP Production Environment
# Generated: $(date)

NODE_ENV=production
APP_NAME=PropelERP
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

NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=https://${DOMAIN}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=propel-erp-documents

BREVO_API_KEY=
SMS_SENDER_NAME=PROPEL

# Emergent LLM Key for AI features
EMERGENT_LLM_KEY=sk-emergent-fEaE0F189Bb1a11AdD

ENABLE_AI_MODULE=true
ENABLE_SMS=false
ENABLE_EMAIL=false
ENVEOF

chmod 600 $DEPLOY_DIR/.env
log ".env created with secure credentials"

# ─── 9. Update docker-compose for production ───────────────
info "Updating docker-compose for production..."
sed -i 's/POSTGRES_PASSWORD: propel_pass/POSTGRES_PASSWORD: '"${DB_PASS}"'/g' docker-compose.yml
sed -i 's/propel_pass@postgres/'"${DB_PASS}"'@postgres/g' docker-compose.yml
sed -i 's/npm run dev/npm start/g' docker-compose.yml

# ─── 10. SSL Certificate ───────────────────────────────────
info "Obtaining SSL certificate for ${DOMAIN}..."
systemctl stop nginx 2>/dev/null || true
docker compose down 2>/dev/null || true

if certbot certonly --standalone --non-interactive --agree-tos \
   -m "$SSL_EMAIL" -d "$DOMAIN" 2>/dev/null; then
  log "SSL certificate obtained"
else
  warn "SSL cert failed — DNS may not be pointing to this server"
  warn "Ensure DNS A record: ${DOMAIN} → 129.159.232.247"
  warn "Then run: certbot certonly --standalone -d ${DOMAIN}"
fi

# ─── 11. Create SSL directory for nginx ────────────────────
mkdir -p $DEPLOY_DIR/infra/nginx/ssl
if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  # Create symlinks for nginx container
  ln -sf /etc/letsencrypt/live/${DOMAIN}/fullchain.pem $DEPLOY_DIR/infra/nginx/ssl/
  ln -sf /etc/letsencrypt/live/${DOMAIN}/privkey.pem $DEPLOY_DIR/infra/nginx/ssl/
fi

# ─── 12. Update nginx volume mount ─────────────────────────
sed -i 's|./infra/nginx/ssl:/etc/nginx/ssl:ro|/etc/letsencrypt:/etc/letsencrypt:ro|g' docker-compose.yml

# ─── 13. Build and start services ──────────────────────────
info "Building and starting Docker services..."
docker compose build --no-cache
docker compose up -d
log "Services started"

# ─── 14. Wait for database and run migrations ──────────────
info "Waiting for database to be ready..."
sleep 30
docker compose exec -T postgres pg_isready -U propel_user -d propel_erp && \
  log "Database is ready" || \
  warn "Database health check failed"

info "Running database migrations..."
docker compose exec -T backend npm run db:migrate 2>/dev/null || \
  warn "Migration failed - may need manual run"

info "Seeding database..."
docker compose exec -T backend npm run db:seed 2>/dev/null || \
  warn "Seed failed - may need manual run"

# ─── 15. Setup auto SSL renewal ────────────────────────────
info "Setting up SSL auto-renewal..."
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "0 3 * * * certbot renew --quiet --post-hook 'docker compose -f ${DEPLOY_DIR}/docker-compose.yml restart nginx'") | crontab -
log "SSL auto-renewal scheduled"

# ─── 16. Create systemd service ────────────────────────────
info "Creating systemd service..."
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
log "Systemd service created"

# ─── Done ──────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            🎉 PropelERP Deployment Complete!               ║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  URL:         https://${DOMAIN}                  ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  📱 OTP Login:                                             ║${NC}"
echo -e "${GREEN}║     Mobile:   9999999999                                   ║${NC}"
echo -e "${GREEN}║     OTP:      121212 (demo mode)                           ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  📊 pgAdmin:  http://129.159.232.247:5050                  ║${NC}"
echo -e "${GREEN}║     Email:    admin@wisewit.ai                             ║${NC}"
echo -e "${GREEN}║     Password: admin123                                     ║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${YELLOW}║  ⚠️  IMPORTANT NEXT STEPS:                                  ║${NC}"
echo -e "${YELLOW}║  1. Setup DNS A record: ${DOMAIN} → 129.159.232.247║${NC}"
echo -e "${YELLOW}║  2. Wait for DNS propagation (5-30 minutes)               ║${NC}"
echo -e "${YELLOW}║  3. Run: certbot certonly --standalone -d ${DOMAIN}       ║${NC}"
echo -e "${YELLOW}║  4. Restart: docker compose restart nginx                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  docker compose -f ${DEPLOY_DIR}/docker-compose.yml ps"
echo "  docker compose -f ${DEPLOY_DIR}/docker-compose.yml logs -f"
echo "  docker compose -f ${DEPLOY_DIR}/docker-compose.yml restart"
echo "  curl https://${DOMAIN}/health"
echo ""
echo -e "${BLUE}Database credentials saved in:${NC} ${DEPLOY_DIR}/.env"
echo ""
