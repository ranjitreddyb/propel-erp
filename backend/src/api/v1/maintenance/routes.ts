import { Router } from 'express';
import { z } from 'zod';
import { db, paginatedQuery } from '../../../config/database';
import { requirePermission } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { AppError } from '../../../utils/AppError';
import { NotificationService } from '../../../services/notification.service';
import { auditLog } from '../../../services/audit.service';

const router = Router();

const createWOSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  propertyId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  category: z.enum(['hvac','electrical','plumbing','civil','fire','lift','cleaning','other']),
  priority: z.enum(['critical','high','medium','low']).default('medium'),
  woType: z.enum(['reactive','preventive','predictive','routine']).default('reactive'),
  assignedTo: z.string().uuid().optional(),
  estimatedCost: z.number().optional(),
  scheduledDate: z.string().optional(),
  slaHours: z.number().int().default(48),
});

router.get('/', requirePermission('maintenance','read'), async (req, res) => {
  const { page=1, pageSize=20, status, priority, propertyId, search } = req.query;
  const companyId = req.user!.companyId;
  let sql = `SELECT wo.*, p.name AS property_name, pu.unit_number,
    v.org_name AS vendor_name,
    EXTRACT(EPOCH FROM (NOW()-wo.created_at))/3600 AS age_hours
    FROM work_orders wo JOIN properties p ON p.id=wo.property_id
    LEFT JOIN property_units pu ON pu.id=wo.unit_id
    LEFT JOIN contacts v ON v.id=wo.assigned_to
    WHERE wo.company_id=$1`;
  const params: unknown[] = [companyId]; let idx=2;
  if (status) { sql+=` AND wo.status=$${idx++}`; params.push(status); }
  if (priority) { sql+=` AND wo.priority=$${idx++}`; params.push(priority); }
  if (propertyId) { sql+=` AND wo.property_id=$${idx++}`; params.push(propertyId); }
  if (search) { sql+=` AND (wo.wo_number ILIKE $${idx} OR wo.title ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
  sql+=` ORDER BY CASE wo.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, wo.created_at DESC`;
  res.json({ success:true, ...(await paginatedQuery(sql, params, Number(page), Number(pageSize))) });
});

router.get('/kpis', requirePermission('maintenance','read'), async (req, res) => {
  const companyId = req.user!.companyId;
  const r = await db.query(`SELECT
    COUNT(*) FILTER (WHERE status='open') AS open_orders,
    COUNT(*) FILTER (WHERE status='in_progress') AS in_progress,
    COUNT(*) FILTER (WHERE priority='critical' AND status NOT IN ('completed','cancelled')) AS critical,
    COUNT(*) FILTER (WHERE status='completed' AND DATE_TRUNC('month',completed_date)=DATE_TRUNC('month',NOW())) AS completed_this_month,
    SUM(actual_cost) FILTER (WHERE status='completed' AND DATE_TRUNC('month',completed_date)=DATE_TRUNC('month',NOW())) AS cost_this_month
    FROM work_orders WHERE company_id=$1`, [companyId]);
  res.json({ success:true, data:r.rows[0] });
});

router.get('/:id', requirePermission('maintenance','read'), async (req, res) => {
  const r = await db.query(`SELECT wo.*, p.name AS property_name, pu.unit_number, v.org_name AS vendor_name
    FROM work_orders wo JOIN properties p ON p.id=wo.property_id
    LEFT JOIN property_units pu ON pu.id=wo.unit_id LEFT JOIN contacts v ON v.id=wo.assigned_to
    WHERE wo.id=$1 AND wo.company_id=$2`, [req.params.id, req.user!.companyId]);
  if (!r.rows[0]) throw new AppError('Work order not found',404);
  res.json({ success:true, data:r.rows[0] });
});

router.post('/', requirePermission('maintenance','create'), validate(createWOSchema), async (req, res) => {
  const companyId=req.user!.companyId, userId=req.user!.id;
  const seq = await db.query('SELECT COUNT(*)+1 AS n FROM work_orders WHERE company_id=$1',[companyId]);
  const woNumber=`WO-${new Date().getFullYear()}-${String(seq.rows[0].n).padStart(4,'0')}`;
  const r = await db.query(`INSERT INTO work_orders (company_id,wo_number,title,description,property_id,
    unit_id,category,priority,wo_type,assigned_to,estimated_cost,scheduled_date,sla_hours,status,raised_by,raised_by_type)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'open',$14,'staff') RETURNING *`,
    [companyId,woNumber,req.body.title,req.body.description||null,req.body.propertyId,
     req.body.unitId||null,req.body.category,req.body.priority,req.body.woType,
     req.body.assignedTo||null,req.body.estimatedCost||null,req.body.scheduledDate||null,
     req.body.slaHours,userId]);
  if (req.body.priority==='critical') {
    await NotificationService.create({ companyId, type:'critical_maintenance',
      title:`🔴 Critical WO: ${woNumber}`, body:req.body.title,
      entityType:'work_order', entityId:r.rows[0].id, channel:'all', priority:'critical' });
  }
  await auditLog(userId,companyId,'create','work_order',r.rows[0].id,null,r.rows[0]);
  res.status(201).json({ success:true, data:r.rows[0] });
});

router.patch('/:id/status', requirePermission('maintenance','update'), async (req, res) => {
  const {id}=req.params, { status, completionNotes, actualCost, rating } = req.body;
  const companyId=req.user!.companyId;
  const r = await db.query(`UPDATE work_orders SET status=$1,
    completion_notes=COALESCE($2,completion_notes),
    actual_cost=COALESCE($3,actual_cost),
    rating=COALESCE($4,rating),
    completed_date=CASE WHEN $1='completed' THEN CURRENT_DATE ELSE completed_date END,
    updated_at=NOW() WHERE id=$5 AND company_id=$6 RETURNING *`,
    [status,completionNotes||null,actualCost||null,rating||null,id,companyId]);
  if (!r.rows[0]) throw new AppError('Work order not found',404);
  if (status==='completed') {
    await db.query("UPDATE property_units SET status='vacant',updated_at=NOW() WHERE id=$1 AND status='under_maintenance'",[r.rows[0].unit_id]);
  }
  res.json({ success:true, data:r.rows[0] });
});

export default router;
