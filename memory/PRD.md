# PropelERP - Product Requirements Document

## Project Overview
AI-Powered Property Management SaaS Platform for enterprise-level property management.

**Domain**: propelerp.wisewit.ai  
**Target Deployment**: OCI VM (129.159.232.247)  
**Repository**: https://github.com/ranjitreddyb/propel-erp

---

## Architecture

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend API | Node.js, Express, TypeScript (Port 4000) |
| AI Engine | Python FastAPI (Port 8000) |
| Database | PostgreSQL 16, Redis 7, MongoDB 7 |
| Auth | JWT + OTP-based mobile login |
| AI Integration | Emergent LLM (GPT-4o) |
| Containerization | Docker + Docker Compose |
| Reverse Proxy | Nginx with SSL (Let's Encrypt) |

---

## User Personas

1. **Property Manager** - Day-to-day operations, tenant management
2. **Finance Team** - AR/AP, invoicing, financial reports
3. **Maintenance Staff** - Work order management
4. **Executive/Owner** - Dashboard, AI insights, forecasting
5. **System Admin** - User/role management, configuration

---

## Core Requirements (Static)

### Authentication
- [x] Mobile number + OTP login (Brevo SMS mocked, OTP: 121212)
- [x] JWT-based session management
- [x] Multi-company support with role switching

### AI Modules
- [x] Predictive Revenue Engine — 12-month income forecast
- [x] Tenant Churn Risk Predictor — 90-day early warning
- [x] Predictive Maintenance AI — IoT sensor anomaly detection
- [x] Contract Intelligence Engine — NLP clause extraction
- [x] AI Property Valuation — Market-indexed valuations
- [x] Tenant Sentiment AI — Satisfaction scoring
- [x] Energy Optimization AI — Auto-scheduling
- [x] PropelAI Chatbot — Portfolio Q&A (Emergent LLM integrated)

### Platform Features
- [x] Workflow Designer — Visual drag-step workflows
- [x] Transaction Authorization — Multi-level approval
- [x] Alerts & Notifications — System alerts + AI insights
- [x] Report Builder — 6 pre-built executive reports
- [x] Document Manager — AI contract analysis, e-signature tracking
- [x] User Management — Role-based access matrix
- [x] Executive Dashboard — Full KPI suite with live charts

---

## What's Been Implemented (Jan 2026)

### Session 1 - Deployment Preparation
- [x] Cloned and analyzed existing codebase
- [x] **Mobile + OTP Authentication**
  - New `/api/v1/auth/send-otp` endpoint
  - New `/api/v1/auth/verify-otp` endpoint
  - New `/api/v1/auth/resend-otp` endpoint
  - Mock OTP (121212) for demo mode
  - Updated frontend login page with OTP flow
- [x] **AI Engine Integration**
  - Replaced Anthropic/OpenAI direct integration with Emergent LLM
  - Integrated GPT-4o via emergentintegrations library
  - Updated requirements.txt and Dockerfile
- [x] **Domain Configuration**
  - Updated all configs for `propelerp.wisewit.ai`
  - Updated nginx.conf with correct domain
  - Updated CORS settings across all services
- [x] **Deployment Assets**
  - Created `deploy-oci.sh` deployment script
  - Created `DEPLOYMENT_OCI.md` guide
  - Created `.env.production` template
  - Updated database seed with phone numbers

---

## Prioritized Backlog

### P0 - Critical (Before Demo)
- [ ] Push code changes to GitHub
- [ ] DNS A record: `propelerp.wisewit.ai` → `129.159.232.247`
- [ ] Run deployment script on OCI VM
- [ ] Verify all services running
- [ ] Test OTP login flow

### P1 - High Priority
- [ ] Enable real Brevo SMS for OTP
- [ ] Add more seed data (properties, tenants, leases)
- [ ] Test all AI modules with real data
- [ ] Load testing for production readiness

### P2 - Medium Priority
- [ ] Setup database backups (pg_dump cron)
- [ ] Implement monitoring (Prometheus/Grafana)
- [ ] Add email notifications (SendGrid/Brevo)
- [ ] Mobile responsive improvements

### P3 - Future/Nice to Have
- [ ] Mobile app (React Native)
- [ ] WhatsApp OTP delivery
- [ ] Multi-language support
- [ ] Advanced analytics dashboard

---

## Next Tasks (Immediate)

1. **User Action**: Create DNS A record pointing `propelerp.wisewit.ai` → `129.159.232.247`
2. **User Action**: SSH into OCI VM and run deployment script
3. **User Action**: Push code changes to GitHub (via "Save to Github" button)
4. Verify deployment by accessing https://propelerp.wisewit.ai
5. Test login with mobile: 9999999999, OTP: 121212

---

## Technical Notes

### Environment Variables Required
- `EMERGENT_LLM_KEY` - For AI chatbot (provided)
- `JWT_SECRET` - Auto-generated during deployment
- `DATABASE_URL` - Auto-configured for Docker
- `BREVO_API_KEY` - Optional, for real SMS

### Ports
- 3000: Frontend (Next.js)
- 4000: Backend API (Node.js)
- 8000: AI Engine (FastAPI)
- 5432: PostgreSQL
- 6379: Redis
- 27017: MongoDB
- 5050: pgAdmin (optional)

---

*Last Updated: January 2026*
