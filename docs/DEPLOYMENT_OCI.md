# PropelERP Deployment Guide
## OCI VM: 129.159.232.247 → propelerp.wisewit.ai

---

## Step 1: DNS Configuration

### Create A Record
Add the following DNS record in your domain registrar (for wisewit.ai):

| Type | Host/Name | Value | TTL |
|------|-----------|-------|-----|
| **A** | `propelerp` | `129.159.232.247` | 300 (or Auto) |

### Where to configure DNS:
- **GoDaddy**: DNS Management → Add Record
- **Cloudflare**: DNS → Add Record (make sure proxy is OFF/DNS Only for SSL)
- **Namecheap**: Advanced DNS → Add New Record
- **Route53**: Create Record → A Record

### Verify DNS propagation:
```bash
# Check if DNS is pointing to the correct IP
nslookup propelerp.wisewit.ai
# or
dig propelerp.wisewit.ai +short

# Expected output:
# 129.159.232.247
```

---

## Step 2: SSH into OCI VM

```bash
# Using your SSH key
ssh -i /path/to/your-key.pem opc@129.159.232.247
# or
ssh -i /path/to/your-key.pem ubuntu@129.159.232.247
```

---

## Step 3: Run Deployment Script

Once logged into the VM:

```bash
# Switch to root
sudo -i

# Download and run deployment script
curl -sSL https://raw.githubusercontent.com/ranjitreddyb/propel-erp/main/infra/scripts/deploy-oci.sh | bash
```

### Or manual deployment:

```bash
sudo -i

# Clone repository
git clone https://github.com/ranjitreddyb/propel-erp.git /opt/propel-erp
cd /opt/propel-erp

# Make script executable
chmod +x infra/scripts/deploy-oci.sh

# Run deployment
./infra/scripts/deploy-oci.sh
```

---

## Step 4: SSL Certificate (After DNS Propagation)

Once DNS is pointing to the server (usually 5-30 minutes):

```bash
# Stop nginx temporarily
docker compose -f /opt/propel-erp/docker-compose.yml stop nginx

# Get SSL certificate
certbot certonly --standalone -d propelerp.wisewit.ai -m admin@wisewit.ai --agree-tos

# Restart services
docker compose -f /opt/propel-erp/docker-compose.yml up -d
```

---

## Step 5: Verify Deployment

```bash
# Check all services are running
docker compose -f /opt/propel-erp/docker-compose.yml ps

# Expected output:
# propel_postgres  - running
# propel_redis     - running
# propel_mongo     - running
# propel_backend   - running
# propel_ai        - running
# propel_frontend  - running
# propel_nginx     - running

# Test health endpoints
curl http://localhost:4000/health  # Backend
curl http://localhost:8000/health  # AI Engine
curl https://propelerp.wisewit.ai/health  # Via Nginx (after SSL)
```

---

## Login Credentials

### OTP Login (Production)
- **Mobile**: 9999999999
- **OTP**: 121212 (demo mode - always works)

### pgAdmin (Database Management)
- **URL**: http://129.159.232.247:5050
- **Email**: admin@wisewit.ai
- **Password**: admin123

---

## Useful Commands

```bash
# View logs
docker compose -f /opt/propel-erp/docker-compose.yml logs -f

# View specific service logs
docker compose -f /opt/propel-erp/docker-compose.yml logs -f backend
docker compose -f /opt/propel-erp/docker-compose.yml logs -f ai-engine

# Restart all services
docker compose -f /opt/propel-erp/docker-compose.yml restart

# Restart specific service
docker compose -f /opt/propel-erp/docker-compose.yml restart backend

# Run database migrations
docker compose -f /opt/propel-erp/docker-compose.yml exec backend npm run db:migrate

# Run database seeds
docker compose -f /opt/propel-erp/docker-compose.yml exec backend npm run db:seed

# Enter backend container
docker compose -f /opt/propel-erp/docker-compose.yml exec backend sh

# Check PostgreSQL
docker compose -f /opt/propel-erp/docker-compose.yml exec postgres psql -U propel_user -d propel_erp
```

---

## Troubleshooting

### DNS not resolving
```bash
# Wait for propagation (up to 48 hours, usually 5-30 mins)
# Check at: https://dnschecker.org
```

### SSL certificate fails
```bash
# Ensure port 80 is open
sudo ufw status
# Should show: 80/tcp ALLOW

# Ensure DNS is pointing correctly
dig propelerp.wisewit.ai +short
# Should return: 129.159.232.247
```

### Database connection issues
```bash
# Check postgres is running
docker compose -f /opt/propel-erp/docker-compose.yml ps postgres

# Check logs
docker compose -f /opt/propel-erp/docker-compose.yml logs postgres
```

### Backend not starting
```bash
# Check logs
docker compose -f /opt/propel-erp/docker-compose.yml logs backend

# Common issue: missing env vars
cat /opt/propel-erp/.env
```

---

## Security Checklist

- [ ] Change default pgAdmin password
- [ ] Close port 5050 (pgAdmin) after initial setup: `ufw delete allow 5050`
- [ ] Enable Brevo SMS for real OTP (update .env)
- [ ] Setup backup for PostgreSQL
- [ ] Configure monitoring (optional: Prometheus/Grafana)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    propelerp.wisewit.ai                     │
│                     129.159.232.247                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    ┌─────────────────┐                                      │
│    │  Nginx :80/:443 │  ← SSL Termination                  │
│    └────────┬────────┘                                      │
│             │                                               │
│    ┌────────┴────────┬─────────────────┐                   │
│    │                 │                 │                   │
│    ▼                 ▼                 ▼                   │
│ ┌──────────┐   ┌──────────┐   ┌──────────┐                │
│ │ Frontend │   │ Backend  │   │AI Engine │                │
│ │ :3000    │   │ :4000    │   │ :8000    │                │
│ │ Next.js  │   │ Node.js  │   │ FastAPI  │                │
│ └────┬─────┘   └────┬─────┘   └────┬─────┘                │
│      │              │              │                       │
│      └──────────────┴──────────────┘                       │
│                     │                                       │
│    ┌────────────────┼────────────────┐                     │
│    │                │                │                     │
│    ▼                ▼                ▼                     │
│ ┌──────┐      ┌──────────┐      ┌───────┐                 │
│ │Redis │      │PostgreSQL│      │MongoDB│                 │
│ │:6379 │      │  :5432   │      │:27017 │                 │
│ └──────┘      └──────────┘      └───────┘                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Support

For issues, contact: admin@wisewit.ai
