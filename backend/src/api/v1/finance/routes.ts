import { Router } from 'express';
import { z } from 'zod';
import { db, paginatedQuery } from '../../../config/database';
import { requirePermission } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { AppError } from '../../../utils/AppError';
import { NotificationService } from '../../../services/notification.service';
import { auditLog } from '../../../services/audit.service';

const router = Router();

// ─── Voucher Schema ───────────────────────────────────────
const voucherSchema = z.object({
  voucherType: z.enum(['receipt', 'payment', 'journal', 'contra', 'sales', 'purchase']),
  date: z.string(),
  narration: z.string().optional(),
  reference: z.string().optional(),
  currency: z.string().default('INR'),
  exchangeRate: z.number().default(1),
  propertyId: z.string().uuid().optional(),
  leaseId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  costCentreId: z.string().uuid().optional(),
  lines: z.array(z.object({
    accountId: z.string().uuid(),
    debitAmount: z.number().default(0),
    creditAmount: z.number().default(0),
    narration: z.string().optional(),
    taxCode: z.string().optional(),
    taxAmount: z.number().default(0),
  })).min(2),
});

// ─── GET /finance/vouchers ────────────────────────────────
router.get('/vouchers', requirePermission('finance', 'read'), async (req, res) => {
  const { page = 1, pageSize = 20, status, type, from, to, search } = req.query;
  const companyId = req.user!.companyId;

  let sql = `
    SELECT v.*, 
      c.first_name || ' ' || COALESCE(c.last_name, '') AS contact_name,
      c.org_name,
      u.first_name || ' ' || u.last_name AS created_by_name
    FROM vouchers v
    LEFT JOIN contacts c ON c.id = v.contact_id
    LEFT JOIN users u ON u.id = v.created_by
    WHERE v.company_id = $1
  `;
  const params: unknown[] = [companyId];
  let idx = 2;

  if (status) { sql += ` AND v.status = $${idx++}`; params.push(status); }
  if (type) { sql += ` AND v.voucher_type = $${idx++}`; params.push(type); }
  if (from) { sql += ` AND v.date >= $${idx++}`; params.push(from); }
  if (to) { sql += ` AND v.date <= $${idx++}`; params.push(to); }
  if (search) {
    sql += ` AND (v.voucher_number ILIKE $${idx} OR v.narration ILIKE $${idx})`;
    params.push(`%${search}%`); idx++;
  }
  sql += ` ORDER BY v.date DESC, v.created_at DESC`;

  const result = await paginatedQuery(sql, params, Number(page), Number(pageSize));
  res.json({ success: true, ...result });
});

// ─── POST /finance/vouchers ───────────────────────────────
router.post('/vouchers', requirePermission('finance', 'create'), validate(voucherSchema), async (req, res) => {
  const companyId = req.user!.companyId;
  const userId = req.user!.id;
  const { voucherType, date, narration, reference, currency, exchangeRate,
          propertyId, leaseId, contactId, costCentreId, lines } = req.body;

  // Validate double-entry balance
  const totalDebit = lines.reduce((sum: number, l: { debitAmount: number }) => sum + l.debitAmount, 0);
  const totalCredit = lines.reduce((sum: number, l: { creditAmount: number }) => sum + l.creditAmount, 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new AppError(`Voucher is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`, 400);
  }

  // Get current financial year
  const fyResult = await db.query(
    'SELECT id FROM financial_years WHERE company_id = $1 AND is_current = true',
    [companyId]
  );
  if (!fyResult.rows[0]) throw new AppError('No active financial year found', 400);

  // Generate voucher number
  const seqResult = await db.query(
    `SELECT COUNT(*) + 1 AS seq FROM vouchers 
     WHERE company_id = $1 AND voucher_type = $2 AND fin_year_id = $3`,
    [companyId, voucherType, fyResult.rows[0].id]
  );
  const seq = seqResult.rows[0].seq.toString().padStart(4, '0');
  const prefix = { receipt: 'RV', payment: 'PV', journal: 'JV', contra: 'CV', sales: 'SI', purchase: 'PI' }[voucherType] || 'VCH';
  const voucherNumber = `${prefix}-${new Date().getFullYear()}-${seq}`;

  // Determine auth level required based on amount
  const requiredAuthLevel = totalDebit > 1000000 ? 3 : totalDebit > 100000 ? 2 : 1;

  const client = await (await import('../../../config/database')).db.connect();
  try {
    await client.query('BEGIN');

    const vResult = await client.query(
      `INSERT INTO vouchers (company_id, fin_year_id, voucher_number, voucher_type, date,
        narration, reference, currency, exchange_rate, total_amount, status,
        required_auth_level, property_id, lease_id, contact_id, cost_centre_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending_auth',$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [companyId, fyResult.rows[0].id, voucherNumber, voucherType, date,
       narration, reference, currency, exchangeRate, totalDebit,
       requiredAuthLevel, propertyId, leaseId, contactId, costCentreId, userId]
    );

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      await client.query(
        `INSERT INTO voucher_lines (voucher_id, account_id, debit_amount, credit_amount, 
          narration, tax_code, tax_amount, line_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [vResult.rows[0].id, l.accountId, l.debitAmount, l.creditAmount,
         l.narration, l.taxCode, l.taxAmount, i]
      );
    }

    await client.query('COMMIT');

    // Notify approvers
    await NotificationService.notifyApprovers(companyId, 'voucher', vResult.rows[0].id, voucherNumber, totalDebit);
    await auditLog(userId, companyId, 'create', 'voucher', vResult.rows[0].id, null, vResult.rows[0]);

    res.status(201).json({ success: true, data: vResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// ─── POST /finance/vouchers/:id/approve ───────────────────
router.post('/vouchers/:id/approve', requirePermission('finance', 'approve'), async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const companyId = req.user!.companyId;

  const voucher = await db.query(
    'SELECT * FROM vouchers WHERE id = $1 AND company_id = $2',
    [id, companyId]
  );
  if (!voucher.rows[0]) throw new AppError('Voucher not found', 404);
  const v = voucher.rows[0];

  if (v.status === 'posted') throw new AppError('Voucher already posted', 400);

  const newLevel = v.auth_level + 1;
  const newStatus = newLevel >= v.required_auth_level ? 'posted' : 'pending_auth';

  const result = await db.query(
    `UPDATE vouchers SET auth_level = $1, status = $2, approved_by = $3,
     posted_at = CASE WHEN $2 = 'posted' THEN NOW() ELSE NULL END,
     updated_at = NOW()
     WHERE id = $4 RETURNING *`,
    [newLevel, newStatus, userId, id]
  );

  await auditLog(userId, companyId, 'approve', 'voucher', id, v, result.rows[0]);
  res.json({ success: true, data: result.rows[0], message: newStatus === 'posted' ? 'Voucher posted successfully' : 'Approved — awaiting next level' });
});

// ─── GET /finance/trial-balance ───────────────────────────
router.get('/trial-balance', requirePermission('finance', 'read'), async (req, res) => {
  const companyId = req.user!.companyId;
  const { from, to } = req.query;

  const result = await db.query(
    `SELECT 
      coa.account_code, coa.account_name, coa.account_type,
      COALESCE(SUM(vl.debit_amount), 0) AS total_debit,
      COALESCE(SUM(vl.credit_amount), 0) AS total_credit,
      COALESCE(SUM(vl.debit_amount), 0) - COALESCE(SUM(vl.credit_amount), 0) AS balance
     FROM chart_of_accounts coa
     LEFT JOIN voucher_lines vl ON vl.account_id = coa.id
     LEFT JOIN vouchers v ON v.id = vl.voucher_id
       AND v.status = 'posted'
       AND ($2::date IS NULL OR v.date >= $2::date)
       AND ($3::date IS NULL OR v.date <= $3::date)
     WHERE coa.company_id = $1 AND coa.is_group = false
     GROUP BY coa.id, coa.account_code, coa.account_name, coa.account_type
     HAVING COALESCE(SUM(vl.debit_amount), 0) + COALESCE(SUM(vl.credit_amount), 0) > 0
     ORDER BY coa.account_code`,
    [companyId, from || null, to || null]
  );

  res.json({ success: true, data: result.rows });
});

// ─── GET /finance/kpis ────────────────────────────────────
router.get('/kpis', requirePermission('finance', 'read'), async (req, res) => {
  const companyId = req.user!.companyId;
  const { month, year } = req.query;

  const result = await db.query(
    `SELECT
      SUM(CASE WHEN coa.account_type = 'income' THEN vl.credit_amount ELSE 0 END) AS total_revenue,
      SUM(CASE WHEN coa.account_type = 'expense' THEN vl.debit_amount ELSE 0 END) AS total_expenses,
      COUNT(DISTINCT inv.id) FILTER (WHERE inv.status = 'unpaid' OR inv.status = 'overdue') AS outstanding_invoices,
      SUM(CASE WHEN inv.status IN ('unpaid','overdue') THEN inv.total_amount - inv.paid_amount ELSE 0 END) AS outstanding_ar
     FROM vouchers v
     JOIN voucher_lines vl ON vl.voucher_id = v.id
     JOIN chart_of_accounts coa ON coa.id = vl.account_id
     LEFT JOIN invoice_items inv ON inv.company_id = v.company_id
     WHERE v.company_id = $1 AND v.status = 'posted'
       AND EXTRACT(MONTH FROM v.date) = COALESCE($2, EXTRACT(MONTH FROM NOW()))
       AND EXTRACT(YEAR FROM v.date) = COALESCE($3, EXTRACT(YEAR FROM NOW()))`,
    [companyId, month || null, year || null]
  );

  res.json({ success: true, data: result.rows[0] });
});

export default router;
