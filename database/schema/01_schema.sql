-- ============================================================
-- PropelERP — PostgreSQL Database Schema
-- Version: 1.0.0
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- fuzzy search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- composite indexes

-- ============================================================
-- CORE / MULTI-TENANCY
-- ============================================================

CREATE TABLE companies (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code          VARCHAR(20) UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  legal_name    VARCHAR(255),
  gstin         VARCHAR(20),
  pan           VARCHAR(15),
  address       JSONB,
  logo_url      TEXT,
  currency      VARCHAR(5) DEFAULT 'INR',
  fiscal_year_start INT DEFAULT 4, -- April
  is_active     BOOLEAN DEFAULT TRUE,
  settings      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cost_centres (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID REFERENCES companies(id) ON DELETE CASCADE,
  code          VARCHAR(20) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  parent_id     UUID REFERENCES cost_centres(id),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USERS & ACCESS CONTROL
-- ============================================================

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name    VARCHAR(100),
  last_name     VARCHAR(100),
  phone         VARCHAR(20),
  avatar_url    TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  is_superadmin BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID REFERENCES companies(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  description   TEXT,
  permissions   JSONB DEFAULT '{}',
  is_system     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_company_roles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id    UUID REFERENCES companies(id) ON DELETE CASCADE,
  role_id       UUID REFERENCES roles(id),
  cost_centre_ids UUID[],
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- ============================================================
-- PROPERTY PORTFOLIO
-- ============================================================

CREATE TABLE properties (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id) ON DELETE CASCADE,
  cost_centre_id  UUID REFERENCES cost_centres(id),
  code            VARCHAR(30) UNIQUE NOT NULL,
  name            VARCHAR(255) NOT NULL,
  type            VARCHAR(50) NOT NULL, -- commercial, residential, retail, industrial, mixed
  address         JSONB NOT NULL,
  city            VARCHAR(100),
  state           VARCHAR(100),
  pincode         VARCHAR(10),
  total_area_sqft DECIMAL(12,2),
  total_units     INT DEFAULT 0,
  purchase_date   DATE,
  purchase_value  DECIMAL(15,2),
  current_value   DECIMAL(15,2),
  depreciation_pct DECIMAL(5,2) DEFAULT 5.0,
  amenities       TEXT[],
  images          TEXT[],
  latitude        DECIMAL(10,7),
  longitude       DECIMAL(10,7),
  is_active       BOOLEAN DEFAULT TRUE,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE property_units (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id     UUID REFERENCES properties(id) ON DELETE CASCADE,
  unit_number     VARCHAR(50) NOT NULL,
  floor           INT,
  unit_type       VARCHAR(50), -- office, apartment, shop, warehouse
  area_sqft       DECIMAL(10,2),
  bedrooms        INT,
  bathrooms       INT,
  facing          VARCHAR(20),
  furnishing      VARCHAR(20) DEFAULT 'unfurnished', -- furnished, semi, unfurnished
  base_rent       DECIMAL(12,2),
  maintenance_charge DECIMAL(10,2),
  status          VARCHAR(20) DEFAULT 'vacant', -- vacant, occupied, under_maintenance, reserved
  features        JSONB DEFAULT '{}',
  images          TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, unit_number)
);

-- ============================================================
-- CRM & TENANTS
-- ============================================================

CREATE TABLE contacts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id) ON DELETE CASCADE,
  contact_type    VARCHAR(20) NOT NULL, -- tenant, prospect, vendor, owner
  salutation      VARCHAR(10),
  first_name      VARCHAR(100),
  last_name       VARCHAR(100),
  org_name        VARCHAR(255),
  email           VARCHAR(255),
  phone           VARCHAR(20),
  alternate_phone VARCHAR(20),
  gstin           VARCHAR(20),
  pan             VARCHAR(15),
  address         JSONB,
  id_proof_type   VARCHAR(50),
  id_proof_number VARCHAR(100),
  kyc_verified    BOOLEAN DEFAULT FALSE,
  kyc_verified_at TIMESTAMPTZ,
  credit_score    INT,
  notes           TEXT,
  tags            TEXT[],
  assigned_to     UUID REFERENCES users(id),
  source          VARCHAR(50), -- walk-in, referral, website, portal
  status          VARCHAR(20) DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE crm_leads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id),
  contact_id      UUID REFERENCES contacts(id),
  stage           VARCHAR(50) DEFAULT 'new', -- new, site_visit, negotiation, agreement, won, lost
  property_type   VARCHAR(50),
  preferred_area  VARCHAR(100),
  budget_min      DECIMAL(12,2),
  budget_max      DECIMAL(12,2),
  area_min_sqft   DECIMAL(10,2),
  area_max_sqft   DECIMAL(10,2),
  move_in_date    DATE,
  purpose         VARCHAR(50), -- office, residential, retail, warehouse
  notes           TEXT,
  probability     INT DEFAULT 0, -- 0-100
  ai_match_score  DECIMAL(5,2),
  assigned_to     UUID REFERENCES users(id),
  lost_reason     TEXT,
  converted_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LEASING
-- ============================================================

CREATE TABLE leases (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        UUID REFERENCES companies(id),
  lease_number      VARCHAR(50) UNIQUE NOT NULL,
  property_id       UUID REFERENCES properties(id),
  unit_id           UUID REFERENCES property_units(id),
  contact_id        UUID REFERENCES contacts(id), -- tenant
  lease_type        VARCHAR(30) DEFAULT 'fixed', -- fixed, monthly, quarterly
  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,
  notice_period_days INT DEFAULT 90,
  lock_in_months    INT DEFAULT 12,
  monthly_rent      DECIMAL(12,2) NOT NULL,
  security_deposit  DECIMAL(12,2),
  maintenance_charge DECIMAL(10,2) DEFAULT 0,
  escalation_pct    DECIMAL(5,2) DEFAULT 0, -- annual escalation
  escalation_type   VARCHAR(20) DEFAULT 'fixed', -- fixed, cpi
  payment_due_day   INT DEFAULT 1,
  grace_period_days INT DEFAULT 5,
  late_fee_pct      DECIMAL(5,2) DEFAULT 2,
  status            VARCHAR(20) DEFAULT 'draft', -- draft, active, expired, terminated, renewed
  currency          VARCHAR(5) DEFAULT 'INR',
  terms_and_conditions TEXT,
  special_conditions TEXT,
  e_signed_at       TIMESTAMPTZ,
  e_sign_provider   VARCHAR(50),
  renewal_lease_id  UUID REFERENCES leases(id),
  parent_lease_id   UUID REFERENCES leases(id),
  created_by        UUID REFERENCES users(id),
  approved_by       UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROPERTY SALES
-- ============================================================

CREATE TABLE property_sales (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id),
  sale_number     VARCHAR(50) UNIQUE NOT NULL,
  unit_id         UUID REFERENCES property_units(id),
  buyer_id        UUID REFERENCES contacts(id),
  sale_value      DECIMAL(15,2) NOT NULL,
  booking_amount  DECIMAL(12,2),
  stamp_duty      DECIMAL(12,2),
  registration_fee DECIMAL(12,2),
  sale_date       DATE,
  registration_date DATE,
  possession_date DATE,
  payment_plan    JSONB DEFAULT '[]', -- array of milestone payments
  status          VARCHAR(20) DEFAULT 'booked', -- booked, agreement, registered, handed_over
  broker_id       UUID REFERENCES contacts(id),
  commission_pct  DECIMAL(5,2),
  notes           TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FINANCIAL ACCOUNTING
-- ============================================================

CREATE TABLE financial_years (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id),
  year_code       VARCHAR(20) NOT NULL, -- e.g. FY2026-27
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  is_current      BOOLEAN DEFAULT FALSE,
  is_closed       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chart_of_accounts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id),
  account_code    VARCHAR(20) NOT NULL,
  account_name    VARCHAR(255) NOT NULL,
  account_type    VARCHAR(30) NOT NULL, -- asset, liability, equity, income, expense
  account_subtype VARCHAR(50),
  parent_id       UUID REFERENCES chart_of_accounts(id),
  is_group        BOOLEAN DEFAULT FALSE,
  opening_balance DECIMAL(15,2) DEFAULT 0,
  currency        VARCHAR(5) DEFAULT 'INR',
  cost_centre_id  UUID REFERENCES cost_centres(id),
  is_system       BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, account_code)
);

CREATE TABLE vouchers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id),
  fin_year_id     UUID REFERENCES financial_years(id),
  voucher_number  VARCHAR(50) NOT NULL,
  voucher_type    VARCHAR(30) NOT NULL, -- receipt, payment, journal, contra, sales, purchase
  date            DATE NOT NULL,
  narration       TEXT,
  reference       VARCHAR(100),
  currency        VARCHAR(5) DEFAULT 'INR',
  exchange_rate   DECIMAL(10,6) DEFAULT 1,
  total_amount    DECIMAL(15,2) NOT NULL,
  status          VARCHAR(20) DEFAULT 'draft', -- draft, pending_auth, approved, posted, cancelled
  auth_level      INT DEFAULT 0,
  required_auth_level INT DEFAULT 1,
  property_id     UUID REFERENCES properties(id),
  lease_id        UUID REFERENCES leases(id),
  contact_id      UUID REFERENCES contacts(id),
  cost_centre_id  UUID REFERENCES cost_centres(id),
  created_by      UUID REFERENCES users(id),
  approved_by     UUID REFERENCES users(id),
  posted_at       TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, fin_year_id, voucher_number)
);

CREATE TABLE voucher_lines (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_id      UUID REFERENCES vouchers(id) ON DELETE CASCADE,
  account_id      UUID REFERENCES chart_of_accounts(id),
  debit_amount    DECIMAL(15,2) DEFAULT 0,
  credit_amount   DECIMAL(15,2) DEFAULT 0,
  narration       TEXT,
  cost_centre_id  UUID REFERENCES cost_centres(id),
  tax_code        VARCHAR(20),
  tax_amount      DECIMAL(12,2) DEFAULT 0,
  line_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoice_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id),
  invoice_number  VARCHAR(50) UNIQUE NOT NULL,
  invoice_type    VARCHAR(20) NOT NULL, -- rent, maintenance, sale, service
  lease_id        UUID REFERENCES leases(id),
  contact_id      UUID REFERENCES contacts(id),
  property_id     UUID REFERENCES properties(id),
  unit_id         UUID REFERENCES property_units(id),
  issue_date      DATE NOT NULL,
  due_date        DATE,
  period_from     DATE,
  period_to       DATE,
  subtotal        DECIMAL(12,2) DEFAULT 0,
  tax_amount      DECIMAL(12,2) DEFAULT 0,
  total_amount    DECIMAL(12,2) NOT NULL,
  paid_amount     DECIMAL(12,2) DEFAULT 0,
  status          VARCHAR(20) DEFAULT 'unpaid', -- unpaid, partial, paid, overdue, cancelled
  line_items      JSONB DEFAULT '[]',
  voucher_id      UUID REFERENCES vouchers(id),
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MAINTENANCE & FACILITY
-- ============================================================

CREATE TABLE work_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id),
  wo_number       VARCHAR(50) UNIQUE NOT NULL,
  wo_type         VARCHAR(20) DEFAULT 'reactive', -- reactive, preventive, predictive, routine
  priority        VARCHAR(10) DEFAULT 'medium', -- critical, high, medium, low
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  property_id     UUID REFERENCES properties(id),
  unit_id         UUID REFERENCES property_units(id),
  category        VARCHAR(50), -- hvac, electrical, plumbing, civil, fire, lift, cleaning
  raised_by       UUID REFERENCES users(id),
  raised_by_type  VARCHAR(20) DEFAULT 'staff', -- staff, tenant, ai_system
  contact_id      UUID REFERENCES contacts(id), -- tenant who raised
  assigned_to     UUID REFERENCES contacts(id), -- vendor
  estimated_cost  DECIMAL(10,2),
  actual_cost     DECIMAL(10,2),
  scheduled_date  DATE,
  completed_date  DATE,
  sla_hours       INT DEFAULT 48,
  status          VARCHAR(20) DEFAULT 'open', -- open, assigned, in_progress, completed, cancelled
  ai_predicted    BOOLEAN DEFAULT FALSE,
  ai_confidence   DECIMAL(5,2),
  images          TEXT[],
  completion_notes TEXT,
  rating          INT, -- 1-5 tenant rating
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id),
  property_id     UUID REFERENCES properties(id),
  unit_id         UUID REFERENCES property_units(id),
  asset_code      VARCHAR(50) UNIQUE NOT NULL,
  name            VARCHAR(255) NOT NULL,
  category        VARCHAR(50), -- hvac, lift, fire, electrical, furniture
  make            VARCHAR(100),
  model           VARCHAR(100),
  serial_number   VARCHAR(100),
  purchase_date   DATE,
  purchase_value  DECIMAL(12,2),
  warranty_expiry DATE,
  amc_expiry      DATE,
  last_serviced   DATE,
  next_service    DATE,
  useful_life_years INT,
  depreciation_method VARCHAR(20) DEFAULT 'slm', -- slm, wdv
  current_value   DECIMAL(12,2),
  status          VARCHAR(20) DEFAULT 'active',
  iot_device_id   VARCHAR(100), -- for predictive maintenance
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROCUREMENT
-- ============================================================

CREATE TABLE purchase_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id),
  po_number       VARCHAR(50) UNIQUE NOT NULL,
  vendor_id       UUID REFERENCES contacts(id),
  property_id     UUID REFERENCES properties(id),
  category        VARCHAR(50),
  items           JSONB DEFAULT '[]',
  subtotal        DECIMAL(12,2),
  tax_amount      DECIMAL(12,2) DEFAULT 0,
  total_amount    DECIMAL(12,2) NOT NULL,
  currency        VARCHAR(5) DEFAULT 'INR',
  delivery_date   DATE,
  delivery_address JSONB,
  payment_terms   VARCHAR(50) DEFAULT 'net_30',
  status          VARCHAR(20) DEFAULT 'draft', -- draft, pending_approval, approved, delivered, cancelled
  approval_level  INT DEFAULT 0,
  work_order_id   UUID REFERENCES work_orders(id),
  notes           TEXT,
  created_by      UUID REFERENCES users(id),
  approved_by     UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- HR
-- ============================================================

CREATE TABLE employees (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id),
  employee_code   VARCHAR(30) UNIQUE NOT NULL,
  user_id         UUID REFERENCES users(id),
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100),
  email           VARCHAR(255) NOT NULL,
  phone           VARCHAR(20),
  date_of_birth   DATE,
  gender          VARCHAR(10),
  address         JSONB,
  department      VARCHAR(100),
  designation     VARCHAR(100),
  grade           VARCHAR(20),
  cost_centre_id  UUID REFERENCES cost_centres(id),
  property_id     UUID REFERENCES properties(id), -- assigned property
  reports_to      UUID REFERENCES employees(id),
  join_date       DATE NOT NULL,
  confirmation_date DATE,
  probation_end   DATE,
  employment_type VARCHAR(20) DEFAULT 'full_time', -- full_time, part_time, contract
  pan             VARCHAR(15),
  aadhar          VARCHAR(20),
  uan             VARCHAR(20), -- PF UAN
  bank_account    JSONB,
  basic_salary    DECIMAL(12,2),
  hra             DECIMAL(10,2),
  allowances      JSONB DEFAULT '{}',
  status          VARCHAR(20) DEFAULT 'active', -- active, resigned, terminated
  exit_date       DATE,
  exit_reason     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id     UUID REFERENCES employees(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  check_in        TIMESTAMPTZ,
  check_out       TIMESTAMPTZ,
  work_hours      DECIMAL(5,2),
  status          VARCHAR(20) DEFAULT 'present', -- present, absent, half_day, wfh, holiday
  overtime_hours  DECIMAL(5,2) DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

CREATE TABLE payroll_runs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id),
  month           INT NOT NULL,
  year            INT NOT NULL,
  status          VARCHAR(20) DEFAULT 'draft', -- draft, processing, approved, paid
  total_gross     DECIMAL(15,2),
  total_deductions DECIMAL(15,2),
  total_net       DECIMAL(15,2),
  processed_by    UUID REFERENCES users(id),
  approved_by     UUID REFERENCES users(id),
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, month, year)
);

-- ============================================================
-- WORKFLOWS
-- ============================================================

CREATE TABLE workflow_definitions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id),
  name            VARCHAR(255) NOT NULL,
  trigger_module  VARCHAR(50), -- lease, voucher, work_order, purchase_order
  trigger_event   VARCHAR(50), -- create, update, status_change
  steps           JSONB NOT NULL DEFAULT '[]',
  conditions      JSONB DEFAULT '{}',
  is_active       BOOLEAN DEFAULT TRUE,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workflow_instances (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  definition_id   UUID REFERENCES workflow_definitions(id),
  entity_type     VARCHAR(50),
  entity_id       UUID,
  current_step    INT DEFAULT 0,
  status          VARCHAR(20) DEFAULT 'active', -- active, completed, rejected, cancelled
  context         JSONB DEFAULT '{}',
  history         JSONB DEFAULT '[]',
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id),
  user_id         UUID REFERENCES users(id),
  type            VARCHAR(50), -- lease_renewal, payment_due, maintenance_alert, ai_insight
  title           VARCHAR(255) NOT NULL,
  body            TEXT,
  entity_type     VARCHAR(50),
  entity_id       UUID,
  channel         VARCHAR(20) DEFAULT 'app', -- app, email, sms, all
  is_read         BOOLEAN DEFAULT FALSE,
  priority        VARCHAR(10) DEFAULT 'normal', -- critical, high, normal, low
  sent_at         TIMESTAMPTZ,
  read_at         TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT TRAIL
-- ============================================================

CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id),
  user_id         UUID REFERENCES users(id),
  action          VARCHAR(50) NOT NULL, -- create, update, delete, login, approve, reject
  entity_type     VARCHAR(50),
  entity_id       UUID,
  old_data        JSONB,
  new_data        JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AI MODULE TABLES
-- ============================================================

CREATE TABLE ai_predictions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID REFERENCES companies(id),
  model_name      VARCHAR(100) NOT NULL,
  entity_type     VARCHAR(50),
  entity_id       UUID,
  prediction_type VARCHAR(50), -- churn_risk, revenue_forecast, maintenance_failure
  prediction_value JSONB NOT NULL,
  confidence      DECIMAL(5,2),
  valid_until     TIMESTAMPTZ,
  acted_upon      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX idx_properties_company ON properties(company_id);
CREATE INDEX idx_units_property ON property_units(property_id);
CREATE INDEX idx_units_status ON property_units(status);
CREATE INDEX idx_leases_company ON leases(company_id);
CREATE INDEX idx_leases_status ON leases(status);
CREATE INDEX idx_leases_end_date ON leases(end_date);
CREATE INDEX idx_leases_unit ON leases(unit_id);
CREATE INDEX idx_vouchers_company_date ON vouchers(company_id, date);
CREATE INDEX idx_vouchers_status ON vouchers(status);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_property ON work_orders(property_id);
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_ai_predictions_entity ON ai_predictions(entity_type, entity_id);

-- Full-text search indexes
CREATE INDEX idx_properties_fts ON properties USING GIN(to_tsvector('english', name || ' ' || COALESCE(city, '')));
CREATE INDEX idx_contacts_fts ON contacts USING GIN(to_tsvector('english', COALESCE(first_name,'') || ' ' || COALESCE(last_name,'') || ' ' || COALESCE(org_name,'')));
