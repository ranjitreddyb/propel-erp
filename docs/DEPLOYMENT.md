# 🚀 PropelERP — Complete Deployment Guide
# Live at: propel.wisewit.ai

---

## PHASE 1 — Push Code to GitHub

### Step 1.1 — Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `propel-erp`
3. Set to **Private**
4. Do NOT initialise with README (we have one)
5. Click **Create Repository**

### Step 1.2 — Push from your machine

```bash
# Navigate to the project folder
cd propel-erp

# Initialise Git
git init
git add .
git commit -m "feat: initial PropelERP production codebase"

# Link to GitHub (replace YOUR_ORG with your GitHub username/org)
git remote add origin https://github.com/YOUR_ORG/propel-erp.git
git branch -M main
git push -u origin main
```

You should see all files appear at github.com/YOUR_ORG/propel-erp ✅

---

## PHASE 2 — Set Up the Production Server

### Step 2.1 — Provision a VPS

**Recommended:** DigitalOcean, AWS EC2, or Hetzner (cheaper in Europe)

| Provider | Plan | Cost | Notes |
|---|---|---|---|
| DigitalOcean | 4 vCPU, 8GB RAM Droplet | ~$48/mo | Best for beginners |
| AWS EC2 | t3.medium | ~$35/mo | Best for Indian data residency (Mumbai) |
| Hetzner | CX31 | ~€14/mo | Cheapest, EU hosted |

**For Indian data residency:** Use AWS `ap-south-1` (Mumbai) region.

### Step 2.2 — Create the server (DigitalOcean example)

1. Go to https://cloud.digitalocean.com
2. Create Droplet → Ubuntu 22.04 LTS
3. 4 vCPU / 8GB RAM ($48/mo) or 2 vCPU / 4GB RAM for demo ($24/mo)
4. Add your SSH key
5. Note the **IP address** (e.g. `165.22.123.45`)

### Step 2.3 — Initial server setup

```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker $USER

# Install Docker Compose v2
apt install docker-compose-plugin -y

# Install Git, Nginx, Certbot
apt install git nginx certbot python3-certbot-nginx -y

# Create app directory
mkdir -p /opt/propel-erp
cd /opt/propel-erp

# Create a deploy user (more secure than root)
adduser propel
usermod -aG docker propel
usermod -aG sudo propel
```

### Step 2.4 — Clone your repo on the server

```bash
# On the server
cd /opt/propel-erp
git clone https://github.com/YOUR_ORG/propel-erp.git .

# Copy and fill environment variables
cp .env.example .env
nano .env
# Fill in all values — especially DATABASE_URL, JWT_SECRET, AWS keys
```

---

## PHASE 3 — Point Your Domain to the Server

### Step 3.1 — DNS Configuration for propel.wisewit.ai

Log in to your domain registrar (wherever wisewit.ai is registered — GoDaddy, Namecheap, Google Domains, etc.)

Go to DNS Management and add:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | propel | YOUR_SERVER_IP | 300 |

Example: If your server IP is `165.22.123.45`:
```
Type: A
Host: propel
Points to: 165.22.123.45
TTL: 300 (5 minutes)
```

Wait 5–30 minutes for DNS to propagate.

**Verify:**
```bash
# From your local machine
nslookup propel.wisewit.ai
# Should return your server IP
```

---

## PHASE 4 — SSL Certificate (HTTPS)

### Step 4.1 — Get free SSL from Let's Encrypt

```bash
# On the server — stop nginx temporarily
systemctl stop nginx

# Get certificate
certbot certonly --standalone -d propel.wisewit.ai

# You'll be prompted for email — enter your email
# Certificate saved to: /etc/letsencrypt/live/propel.wisewit.ai/

# Auto-renew setup (certificates expire every 90 days)
crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet && docker compose -f /opt/propel-erp/docker-compose.yml restart nginx
```

---

## PHASE 5 — Configure & Launch

### Step 5.1 — Set GitHub Secrets for CI/CD

Go to your GitHub repo → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name | Value |
|---|---|
| `PROD_HOST` | Your server IP (e.g. 165.22.123.45) |
| `PROD_USER` | `root` or `propel` |
| `PROD_SSH_KEY` | Contents of your private SSH key (~/.ssh/id_rsa) |
| `SLACK_WEBHOOK_URL` | Your Slack webhook (optional) |

### Step 5.2 — First manual deployment

```bash
# On the server
cd /opt/propel-erp

# Make sure .env is filled
cat .env | grep DATABASE_URL

# Start all services
docker compose up -d --build

# Watch logs
docker compose logs -f

# Check all containers are running
docker compose ps
```

Expected output:
```
NAME                STATUS          PORTS
propel_postgres     Up (healthy)    0.0.0.0:5432->5432/tcp
propel_redis        Up (healthy)    0.0.0.0:6379->6379/tcp
propel_backend      Up              0.0.0.0:4000->4000/tcp
propel_ai           Up              0.0.0.0:8000->8000/tcp
propel_frontend     Up              0.0.0.0:3000->3000/tcp
propel_nginx        Up              0.0.0.0:80->80, 443->443
```

### Step 5.3 — Run database migrations and seed data

```bash
# Run migrations
docker compose exec backend npm run db:migrate

# Seed initial data (creates admin user, chart of accounts, etc.)
docker compose exec backend npm run db:seed

# Verify DB has tables
docker compose exec postgres psql -U propel_user -d propel_erp -c "\dt"
```

---

## PHASE 6 — Verify Live at propel.wisewit.ai

```bash
# Health check
curl https://propel.wisewit.ai/health
# Expected: {"status":"healthy","service":"PropelERP API"}

# Frontend
curl -I https://propel.wisewit.ai
# Expected: HTTP/2 200
```

Open your browser: **https://propel.wisewit.ai** 🎉

**Default login credentials (change immediately!):**
- Email: `admin@wisewit.ai`
- Password: `PropelAdmin@2026`

---

## PHASE 7 — Ongoing: GitHub Push → Auto-Deploy

After the first manual deploy, every push to `main` branch will:

1. ✅ Run tests (backend + frontend)
2. 🐳 Build Docker images
3. 📦 Push to GitHub Container Registry
4. 🚀 SSH into server and deploy automatically
5. 🔍 Run health check
6. 💬 Notify Slack (if configured)

**Workflow:**
```bash
# On your local machine — make a change
git add .
git commit -m "feat: add new property type filter"
git push origin main
# → GitHub Actions kicks in automatically
# → Live in ~4-5 minutes
```

Watch at: `github.com/YOUR_ORG/propel-erp/actions`

---

## PHASE 8 — Production Checklist Before Chairman Demo

Run through this before the demo:

```
☐ https://propel.wisewit.ai loads correctly
☐ SSL padlock shows (HTTPS green)
☐ Login works with admin credentials
☐ Dashboard KPIs load correctly
☐ At least 3 properties seeded with data
☐ Leases, tenants, finance data seeded
☐ AI chat responds correctly
☐ Notifications panel shows alerts
☐ Mobile responsive (test on phone)
☐ Change default admin password
☐ Set up your company name and logo
```

---

## TROUBLESHOOTING

### Container won't start
```bash
docker compose logs backend --tail=50
docker compose logs postgres --tail=20
```

### Database connection failed
```bash
# Check DATABASE_URL in .env
docker compose exec backend sh -c "echo $DATABASE_URL"
# Test connection
docker compose exec postgres psql -U propel_user -d propel_erp
```

### SSL certificate error
```bash
certbot renew --dry-run
ls /etc/letsencrypt/live/propel.wisewit.ai/
```

### Out of memory on server
```bash
# Check usage
free -h
docker stats
# Add swap if needed
fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
```

### Nginx 502 Bad Gateway
```bash
# Check if backend is running
docker compose ps
docker compose restart backend
```

---

## ESTIMATED TIMELINE

| Phase | Time Required |
|---|---|
| Phase 1: Push to GitHub | 5 minutes |
| Phase 2: VPS setup | 30 minutes |
| Phase 3: DNS setup | 5 min (+ 30 min DNS propagation) |
| Phase 4: SSL | 5 minutes |
| Phase 5: Deploy | 15 minutes |
| Phase 6: Verify & seed data | 10 minutes |
| **Total** | **~75 minutes** |
