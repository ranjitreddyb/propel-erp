/**
 * PropelERP Scheduled Services
 * Cron jobs for automated operations:
 * - Rent invoice generation
 * - Lease renewal alerts
 * - AI prediction refresh
 * - Payment overdue escalation
 * - Daily executive digest email
 */
import cron from 'node-cron';
import { db } from '../config/database';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { logger } from '../utils/logger';
import axios from 'axios';
import { config } from '../config/env';

export function startScheduledJobs(): void {
  logger.info('⏰ Starting scheduled jobs...');

  // ─── Daily: Generate rent invoices (runs at 6:00 AM) ──
  cron.schedule('0 6 * * *', async () => {
    logger.info('[CRON] Running: Monthly rent invoice generation');
    try {
      await generateMonthlyInvoices();
    } catch (err) {
      logger.error('[CRON] Invoice generation failed:', err);
    }
  });

  // ─── Daily: Lease renewal alerts (runs at 8:00 AM) ───
  cron.schedule('0 8 * * *', async () => {
    logger.info('[CRON] Running: Lease renewal alerts');
    try {
      await sendLeaseRenewalAlerts();
    } catch (err) {
      logger.error('[CRON] Lease renewal alerts failed:', err);
    }
  });

  // ─── Daily: Mark overdue invoices (runs at 9:00 AM) ──
  cron.schedule('0 9 * * *', async () => {
    logger.info('[CRON] Running: Mark overdue invoices');
    try {
      await markOverdueInvoices();
    } catch (err) {
      logger.error('[CRON] Overdue invoice marking failed:', err);
    }
  });

  // ─── Every 6 hours: Refresh AI predictions ────────────
  cron.schedule('0 */6 * * *', async () => {
    logger.info('[CRON] Running: AI prediction refresh');
    try {
      await refreshAIPredictions();
    } catch (err) {
      logger.error('[CRON] AI refresh failed:', err);
    }
  });

  // ─── Daily at 7:30 AM: Executive digest email ─────────
  cron.schedule('30 7 * * 1-5', async () => {  // weekdays only
    logger.info('[CRON] Running: Executive digest');
    try {
      await sendExecutiveDigest();
    } catch (err) {
      logger.error('[CRON] Executive digest failed:', err);
    }
  });

  // ─── Hourly: Check SLA breaches on work orders ────────
  cron.schedule('0 * * * *', async () => {
    try {
      await checkWorkOrderSLA();
    } catch (err) {
      logger.error('[CRON] SLA check failed:', err);
    }
  });

  logger.info('✅ All scheduled jobs registered');
}

// ─── Generate monthly rent invoices ───────────────────────
async function generateMonthlyInvoices(): Promise<void> {
  const today = new Date();
  // Only run on payment due dates
  const activeLeases = await db.query(
    `SELECT l.*, c.org_name, c.first_name, c.email, p.company_id
     FROM leases l
     JOIN contacts c ON c.id = l.contact_id
     JOIN properties p ON p.id = l.property_id
     WHERE l.status = 'active'
       AND l.payment_due_day = $1
       AND NOT EXISTS (
         SELECT 1 FROM invoice_items inv
         WHERE inv.lease_id = l.id
           AND EXTRACT(MONTH FROM inv.issue_date) = $2
           AND EXTRACT(YEAR FROM inv.issue_date) = $3
       )`,
    [today.getDate(), today.getMonth() + 1, today.getFullYear()]
  );

  for (const lease of activeLeases.rows) {
    try {
      // Get current FY
      const fy = await db.query(
        'SELECT id FROM financial_years WHERE company_id=$1 AND is_current=true',
        [lease.company_id]
      );
      if (!fy.rows[0]) continue;

      const invoiceSeq = await db.query(
        'SELECT COUNT(*)+1 AS n FROM invoice_items WHERE company_id=$1', [lease.company_id]
      );
      const invoiceNumber = `INV-${today.getFullYear()}-${String(invoiceSeq.rows[0].n).padStart(5, '0')}`;
      const totalAmount = parseFloat(lease.monthly_rent) + parseFloat(lease.maintenance_charge || 0);
      const dueDate = new Date(today.getFullYear(), today.getMonth(), lease.payment_due_day + (lease.grace_period_days || 5));

      await db.query(
        `INSERT INTO invoice_items (company_id, invoice_number, invoice_type, lease_id, contact_id,
          property_id, unit_id, issue_date, due_date,
          period_from, period_to, subtotal, total_amount, status, created_by,
          line_items)
         VALUES ($1,$2,'rent',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'unpaid',NULL,$13)`,
        [
          lease.company_id, invoiceNumber, lease.id, lease.contact_id,
          lease.property_id, lease.unit_id,
          today.toISOString().split('T')[0],
          dueDate.toISOString().split('T')[0],
          new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
          new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0],
          totalAmount, totalAmount,
          JSON.stringify([
            { description: 'Monthly Rent', amount: lease.monthly_rent },
            ...(lease.maintenance_charge > 0
              ? [{ description: 'Maintenance Charge', amount: lease.maintenance_charge }]
              : []),
          ]),
        ]
      );

      logger.info(`[INVOICE] Generated ${invoiceNumber} for lease ${lease.lease_number}`);

      // Notify tenant via email
      if (lease.email) {
        await EmailService.send({
          to: lease.email,
          subject: `Rent Invoice ${invoiceNumber} — ₹${totalAmount.toLocaleString('en-IN')}`,
          text: `Dear ${lease.org_name || lease.first_name}, your rent invoice for ₹${totalAmount.toLocaleString('en-IN')} is due on ${dueDate.toDateString()}.`,
          template: 'invoice',
          data: { invoiceNumber, amount: totalAmount, dueDate: dueDate.toDateString() },
        });
      }
    } catch (err) {
      logger.error(`[INVOICE] Failed for lease ${lease.lease_number}:`, err);
    }
  }

  logger.info(`[INVOICE] Generated invoices for ${activeLeases.rows.length} leases`);
}

// ─── Send lease renewal alerts ────────────────────────────
async function sendLeaseRenewalAlerts(): Promise<void> {
  // Leases expiring in 30, 60, 90 days
  const thresholds = [30, 60, 90];

  for (const days of thresholds) {
    const expiring = await db.query(
      `SELECT l.*, p.company_id, c.org_name, c.first_name
       FROM leases l
       JOIN contacts c ON c.id = l.contact_id
       JOIN properties p ON p.id = l.property_id
       WHERE l.status = 'active'
         AND l.end_date = CURRENT_DATE + $1::interval`,
      [`${days} days`]
    );

    for (const lease of expiring.rows) {
      await NotificationService.create({
        companyId:  lease.company_id,
        type:       'lease_renewal',
        title:      `Lease Renewal Due in ${days} Days: ${lease.lease_number}`,
        body:       `${lease.org_name || lease.first_name} — Expires ${lease.end_date}. ₹${lease.monthly_rent}/month.`,
        entityType: 'lease',
        entityId:   lease.id,
        channel:    'all',
        priority:   days <= 30 ? 'high' : 'normal',
      });
    }

    if (expiring.rows.length > 0) {
      logger.info(`[RENEWAL] ${expiring.rows.length} leases expiring in ${days} days — alerts sent`);
    }
  }
}

// ─── Mark overdue invoices ────────────────────────────────
async function markOverdueInvoices(): Promise<void> {
  const result = await db.query(
    `UPDATE invoice_items SET status='overdue', updated_at=NOW()
     WHERE status='unpaid' AND due_date < CURRENT_DATE
     RETURNING id, company_id, invoice_number, contact_id, total_amount`
  );
  if (result.rows.length > 0) {
    logger.info(`[OVERDUE] Marked ${result.rows.length} invoices as overdue`);
    // Group by company and notify
    const byCompany: Record<string, typeof result.rows> = {};
    for (const inv of result.rows) {
      if (!byCompany[inv.company_id]) byCompany[inv.company_id] = [];
      byCompany[inv.company_id].push(inv);
    }
    for (const [companyId, invoices] of Object.entries(byCompany)) {
      await NotificationService.create({
        companyId,
        type: 'payment_overdue',
        title: `${invoices.length} Invoice(s) Overdue`,
        body: `Total overdue: ₹${invoices.reduce((s, i) => s + parseFloat(i.total_amount), 0).toLocaleString('en-IN')}`,
        channel: 'all',
        priority: 'high',
      });
    }
  }
}

// ─── Refresh AI predictions ───────────────────────────────
async function refreshAIPredictions(): Promise<void> {
  const companies = await db.query('SELECT id FROM companies WHERE is_active=true');
  for (const company of companies.rows) {
    try {
      await axios.get(`${config.AI_ENGINE_URL}/api/v1/revenue-forecast/${company.id}`, { timeout: 30000 });
      await axios.get(`${config.AI_ENGINE_URL}/api/v1/churn-risks/${company.id}`, { timeout: 30000 });
    } catch (err) {
      logger.warn(`[AI] Prediction refresh failed for company ${company.id}`);
    }
  }
}

// ─── Work order SLA check ─────────────────────────────────
async function checkWorkOrderSLA(): Promise<void> {
  const breached = await db.query(
    `SELECT wo.*, p.company_id FROM work_orders wo
     JOIN properties p ON p.id = wo.property_id
     WHERE wo.status IN ('open','assigned')
       AND wo.created_at + (wo.sla_hours || ' hours')::interval < NOW()
       AND wo.priority IN ('critical','high')`
  );
  for (const wo of breached.rows) {
    await NotificationService.create({
      companyId:  wo.company_id,
      type:       'sla_breach',
      title:      `SLA Breach: ${wo.wo_number}`,
      body:       `Work order "${wo.title}" has exceeded SLA of ${wo.sla_hours} hours.`,
      entityType: 'work_order',
      entityId:   wo.id,
      channel:    'all',
      priority:   'critical',
    });
  }
}

// ─── Executive digest ──────────────────────────────────────
async function sendExecutiveDigest(): Promise<void> {
  const admins = await db.query(
    `SELECT u.email, u.first_name FROM users u WHERE u.is_superadmin=true AND u.is_active=true`
  );
  for (const admin of admins.rows) {
    await EmailService.send({
      to:       admin.email,
      subject:  `PropelERP Daily Digest — ${new Date().toDateString()}`,
      text:     `Good morning ${admin.first_name}, here's your daily property portfolio summary.`,
      template: 'digest',
    });
  }
}
