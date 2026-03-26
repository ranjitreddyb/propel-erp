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
| AI Engine | Python FastAPI (Port 8001 external, 8000 internal) |
| Database | PostgreSQL 16, Redis 7, MongoDB 7 |
| Auth | JWT + OTP-based mobile login (localStorage) |
| AI Integration | Emergent LLM (GPT-4o) |
| Containerization | Docker + Docker Compose |
| Reverse Proxy | Nginx with SSL (Cloudflare + Let's Encrypt) |

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
- [x] Mobile number + OTP login (Mock OTP: 121212)
- [x] JWT-based session management (localStorage)
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
- [x] **Sahayak Floating Assistant** — Global AI chatbot

### Platform Features
- [x] Workflow Designer — Visual drag-step workflows
- [x] Transaction Authorization — Multi-level approval
- [x] Alerts & Notifications — System alerts + AI insights
- [x] Report Builder — 6 pre-built executive reports
- [x] Document Manager — AI contract analysis, e-signature tracking
- [x] User Management — Role-based access matrix
- [x] Executive Dashboard — Full KPI suite with live charts
- [x] **CRM Module** — Lead management and contacts

---

## What's Been Implemented

### Session 1 - Deployment Preparation (Jan 2026)
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

### Session 2 - UI/UX Enhancements (Dec 16, 2025)
- [x] **CRM Module Created**
  - `/dashboard/crm/page.tsx` - Full CRM page
  - Sales leads table with stage management
  - Contact database tab (Tenants/Vendors)
  - Search and filter functionality
  - Lead scoring visualization
  
- [x] **HR Search Enhancement**
  - Real-time search across all employee fields
  - Department filter dropdown
  - Results count display
  - Empty state handling with clear filters
  
- [x] **Sahayak Floating Chatbot**
  - `SahayakChatbot.tsx` component
  - Animated floating button with bounce effect
  - Chat window with minimize/expand
  - Quick prompts for common queries
  - AI Engine integration via Nginx proxy
  - Fallback demo responses when AI unavailable
  
- [x] **Auth System Cleanup**
  - Removed next-auth dependencies from AppShell
  - Updated Providers to remove SessionProvider
  - Updated dashboard layout with client-side auth
  - Updated API service to use localStorage token
  
- [x] **UI Theme Refinement**
  - Real estate professional dark theme
  - Gold accent colors for luxury feel
  - Improved table and card styling
  - Added animation utilities (bounce, shimmer)
  - Enhanced scrollbar and form inputs

---

## Prioritized Backlog

### P0 - Critical (COMPLETED)
- [x] Fix CRM 404 error
- [x] Add HR search functionality
- [x] Add Sahayak floating chatbot
- [x] Remove next-auth dependencies

### P1 - High Priority
- [ ] Admin FAQ management for Sahayak
- [ ] Test AI Engine integration end-to-end on live server
- [ ] Enable real Brevo SMS for OTP

### P2 - Medium Priority
- [ ] Add more CRM functionality (lead creation form)
- [ ] Mobile responsive improvements
- [ ] Setup database backups (pg_dump cron)
- [ ] Implement monitoring (Prometheus/Grafana)

### P3 - Future/Nice to Have
- [ ] Mobile app (React Native)
- [ ] WhatsApp OTP delivery
- [ ] Multi-language support
- [ ] Advanced analytics dashboard

---

## Deployment Instructions

### For OCI VM Deployment (from MacBook terminal)

```bash
# 1. SSH into OCI VM
ssh -i ~/path/to/oci-key opc@129.159.232.247

# 2. Navigate to project
cd /home/opc/propel-erp

# 3. Pull latest code from GitHub
git pull origin main

# 4. Rebuild and restart containers
docker-compose down
docker-compose build --no-cache frontend ai-engine
docker-compose up -d

# 5. Check logs
docker-compose logs -f frontend
docker-compose logs -f ai-engine

# 6. Verify services
curl https://propelerp.wisewit.ai/health
curl https://propelerp.wisewit.ai/ai/chat -X POST -H "Content-Type: application/json" -d '{"message":"hello","company_id":"1","history":[]}'
```

---

## Technical Notes

### Environment Variables Required
- `EMERGENT_LLM_KEY` - For AI chatbot (provided)
- `JWT_SECRET` - Auto-generated during deployment
- `DATABASE_URL` - Auto-configured for Docker
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_AI_URL` - AI Engine URL (via Nginx proxy)

### Ports
- 3000: Frontend (Next.js)
- 4000: Backend API (Node.js)
- 8001: AI Engine external (8000 internal)
- 5432: PostgreSQL
- 6379: Redis
- 27017: MongoDB
- 5050: pgAdmin (optional)

### Key Files Modified This Session
1. `/frontend/src/app/dashboard/crm/page.tsx` - NEW
2. `/frontend/src/app/dashboard/hr/page.tsx` - Updated with search
3. `/frontend/src/components/layout/SahayakChatbot.tsx` - NEW
4. `/frontend/src/components/layout/AppShell.tsx` - Removed next-auth
5. `/frontend/src/components/layout/Providers.tsx` - Removed SessionProvider
6. `/frontend/src/app/dashboard/layout.tsx` - Client-side auth
7. `/frontend/src/services/api.ts` - localStorage token
8. `/frontend/src/styles/globals.css` - Theme enhancement
9. `/docker-compose.yml` - AI Engine port mapping

---

## Test Credentials
- **Phone:** 9999999999
- **OTP:** 121212

---

## Known Issues
1. Loading flicker on dashboard due to client-side auth check
2. AI Engine responses may timeout on complex queries
3. Sahayak uses demo responses if AI Engine is unreachable

---

*Last Updated: December 16, 2025*
