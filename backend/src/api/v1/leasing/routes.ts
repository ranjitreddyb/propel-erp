import { Router } from 'express';
import { z } from 'zod';
import { db, paginatedQuery } from '../../../config/database';
import { requirePermission } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { AppError } from '../../../utils/AppError';
import { NotificationService } from '../../../services/notification.service';
import { auditLog } from '../../../services/audit.service';

const router = Router();

const createLeaseSchema = z.object({
  propertyId: z.string().uuid(), unitId: z.string().uuid(), contactId: z.string().uuid(),
  leaseType: z.enum(['fixed','monthly','quarterly']).default('fixed'),
  startDate: z.string(), endDate: z.string(),
  monthlyRent: z.number().positive(), securityDeposit: z.number().min(0).default(0),
  maintenanceCharge: z.number().min(0).default(0), escalationPct: z.number().default(0),
  noticePeriodDays: z.number().int().default(90), lockInMonths: z.number().int().default(12),
  paymentDueDay: z.number().int().min(1).max(28).default(1),
});

router.get('/', requirePermission('leasing','read'), async (req, res) => {
  const { page=1, pageSize=20, status, propertyId, search, expiringDays } = req.query;
  const companyId = req.user!.companyId;
  let sql = `SELECT l.*, c.first_name, c.last_name, c.org_name, c.email, c.phone,
    pu.unit_number, pu.floor, p.name AS property_name, (l.end_date - CURRENT_DATE) AS days_to_expiry
    FROM leases l JOIN contacts c ON c.id=l.contact_id JOIN property_units pu ON pu.id=l.unit_id
    JOIN properties p ON p.id=l.property_id WHERE l.company_id=$1`;
  const params: unknown[] = [companyId]; let idx=2;
  if (status) { sql+=` AND l.status=$${idx++}`; params.push(status); }
  if (propertyId) { sql+=` AND l.property_id=$${idx++}`; params.push(propertyId); }
  if (expiringDays) { sql+=` AND l.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${Number(expiringDays)} days'`; }
  if (search) { sql+=` AND (l.lease_number ILIKE $${idx} OR c.org_name ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
  sql+=` ORDER BY l.end_date ASC`;
  res.json({ success:true, ...(await paginatedQuery(sql, params, Number(page), Number(pageSize))) });
});

router.get('/kpis', requirePermission('leasing','read'), async (req, res) => {
  const companyId = req.user!.companyId;
  const r = await db.query(`SELECT
    COUNT(*) FILTER (WHERE status='active') AS active_leases,
    COUNT(*) FILTER (WHERE status='expired') AS expired_leases,
    COUNT(*) FILTER (WHERE status='active' AND end_date<=CURRENT_DATE+INTERVAL '30 days') AS due_30_days,
    SUM(monthly_rent) FILTER (WHERE status='active') AS total_monthly_rent,
    SUM(security_deposit) FILTER (WHERE status='active') AS total_deposits_held
    FROM leases WHERE company_id=$1`, [companyId]);
  res.json({ success:true, data:r.rows[0] });
});

router.get('/due-renewals', requirePermission('leasing','read'), async (req, res) => {
  const companyId = req.user!.companyId;
  const r = await db.query(`SELECT l.*, c.org_name, c.first_name, pu.unit_number, p.name AS property_name,
    (l.end_date - CURRENT_DATE) AS days_to_expiry FROM leases l
    JOIN contacts c ON c.id=l.contact_id JOIN property_units pu ON pu.id=l.unit_id
    JOIN properties p ON p.id=l.property_id
    WHERE l.company_id=$1 AND l.status='active' AND l.end_date<=CURRENT_DATE+INTERVAL '90 days'
    ORDER BY l.end_date`, [companyId]);
  res.json({ success:true, data:r.rows });
});

router.get('/:id', requirePermission('leasing','read'), async (req, res) => {
  const r = await db.query(`SELECT l.*, c.first_name, c.last_name, c.org_name, c.email, c.phone,
    pu.unit_number, p.name AS property_name FROM leases l
    JOIN contacts c ON c.id=l.contact_id JOIN property_units pu ON pu.id=l.unit_id
    JOIN properties p ON p.id=l.property_id WHERE l.id=$1 AND l.company_id=$2`,
    [req.params.id, req.user!.companyId]);
  if (!r.rows[0]) throw new AppError('Lease not found', 404);
  res.json({ success:true, data:r.rows[0] });
});

router.post('/', requirePermission('leasing','create'), validate(createLeaseSchema), async (req, res) => {
  const companyId=req.user!.companyId, userId=req.user!.id;
  const unit = await db.query('SELECT status FROM property_units WHERE id=$1',[req.body.unitId]);
  if (!unit.rows[0]) throw new AppError('Unit not found',404);
  if (unit.rows[0].status==='occupied') throw new AppError('Unit already occupied',409);
  const seq = await db.query('SELECT COUNT(*)+1 AS n FROM leases WHERE company_id=$1',[companyId]);
  const leaseNumber=`LSE-${new Date().getFullYear()}-${String(seq.rows[0].n).padStart(4,'0')}`;
  const r = await db.query(`INSERT INTO leases (company_id,lease_number,property_id,unit_id,contact_id,
    lease_type,start_date,end_date,monthly_rent,security_deposit,maintenance_charge,escalation_pct,
    notice_period_days,lock_in_months,payment_due_day,status,created_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'draft',$16) RETURNING *`,
    [companyId,leaseNumber,req.body.propertyId,req.body.unitId,req.body.contactId,
     req.body.leaseType,req.body.startDate,req.body.endDate,req.body.monthlyRent,
     req.body.securityDeposit,req.body.maintenanceCharge,req.body.escalationPct,
     req.body.noticePeriodDays,req.body.lockInMonths,req.body.paymentDueDay,userId]);
  await auditLog(userId,companyId,'create','lease',r.rows[0].id,null,r.rows[0]);
  res.status(201).json({ success:true, data:r.rows[0] });
});

router.post('/:id/activate', requirePermission('leasing','update'), async (req, res) => {
  const {id}=req.params, companyId=req.user!.companyId, userId=req.user!.id;
  const lease = await db.query('SELECT * FROM leases WHERE id=$1 AND company_id=$2',[id,companyId]);
  if (!lease.rows[0]) throw new AppError('Lease not found',404);
  const c = await db.connect();
  try {
    await c.query('BEGIN');
    await c.query("UPDATE leases SET status='active',updated_at=NOW() WHERE id=$1",[id]);
    await c.query("UPDATE property_units SET status='occupied',updated_at=NOW() WHERE id=$1",[lease.rows[0].unit_id]);
    await c.query('COMMIT');
  } catch(e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); }
  await auditLog(userId,companyId,'activate','lease',id,{status:'draft'},{status:'active'});
  res.json({ success:true, message:'Lease activated' });
});

router.post('/:id/terminate', requirePermission('leasing','update'), async (req, res) => {
  const {id}=req.params, companyId=req.user!.companyId;
  const {reason}=req.body;
  const lease = await db.query('SELECT * FROM leases WHERE id=$1 AND company_id=$2',[id,companyId]);
  if (!lease.rows[0]) throw new AppError('Lease not found',404);
  const c = await db.connect();
  try {
    await c.query('BEGIN');
    await c.query(`UPDATE leases SET status='terminated',updated_at=NOW() WHERE id=$1`,[id]);
    await c.query(`UPDATE property_units SET status='vacant',updated_at=NOW() WHERE id=$1`,[lease.rows[0].unit_id]);
    await c.query('COMMIT');
  } catch(e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); }
  res.json({ success:true, message:'Lease terminated, unit marked vacant' });
});

export default router;
