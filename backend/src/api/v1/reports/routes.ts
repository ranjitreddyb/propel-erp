import { Router } from 'express';
import { db } from '../../../config/database';
import { requirePermission } from '../../../middleware/auth';
import { config } from '../../../config/env';
const router = Router();

router.get('/rental-collection', requirePermission('reports','read'), async (req, res) => {
  const { from, to } = req.query;
  const companyId=req.user!.companyId;
  const r = await db.query(`SELECT p.name AS property_name, pu.unit_number,
    c.org_name AS tenant_name, inv.invoice_number, inv.issue_date, inv.due_date,
    inv.total_amount, inv.paid_amount, inv.status
    FROM invoice_items inv JOIN leases l ON l.id=inv.lease_id
    JOIN property_units pu ON pu.id=l.unit_id JOIN properties p ON p.id=l.property_id
    JOIN contacts c ON c.id=l.contact_id
    WHERE inv.company_id=$1 AND inv.invoice_type='rent'
    AND ($2::date IS NULL OR inv.issue_date>=$2) AND ($3::date IS NULL OR inv.issue_date<=$3)
    ORDER BY inv.due_date DESC LIMIT 500`, [companyId,from||null,to||null]);
  res.json({ success:true, data:r.rows });
});

router.get('/occupancy', requirePermission('reports','read'), async (req, res) => {
  const companyId=req.user!.companyId;
  const r = await db.query(`SELECT p.name, p.type,
    COUNT(pu.id) AS total_units,
    COUNT(pu.id) FILTER(WHERE pu.status='occupied') AS occupied,
    COUNT(pu.id) FILTER(WHERE pu.status='vacant') AS vacant,
    ROUND(COUNT(pu.id) FILTER(WHERE pu.status='occupied')::numeric/NULLIF(COUNT(pu.id),0)*100,1) AS occupancy_rate,
    SUM(l.monthly_rent) FILTER(WHERE l.status='active') AS monthly_income
    FROM properties p JOIN property_units pu ON pu.property_id=p.id
    LEFT JOIN leases l ON l.unit_id=pu.id AND l.status='active'
    WHERE p.company_id=$1 GROUP BY p.id ORDER BY p.name`,[companyId]);
  res.json({ success:true, data:r.rows });
});

router.get('/lease-expiry', requirePermission('reports','read'), async (req, res) => {
  const { days=90 } = req.query;
  const companyId=req.user!.companyId;
  const r = await db.query(`SELECT l.lease_number, c.org_name, pu.unit_number, p.name AS property_name,
    l.end_date, l.monthly_rent, (l.end_date-CURRENT_DATE) AS days_to_expiry,
    l.escalation_pct
    FROM leases l JOIN contacts c ON c.id=l.contact_id
    JOIN property_units pu ON pu.id=l.unit_id JOIN properties p ON p.id=l.property_id
    WHERE l.company_id=$1 AND l.status='active'
    AND l.end_date<=CURRENT_DATE+$2::interval ORDER BY l.end_date`,
    [companyId,`${days} days`]);
  res.json({ success:true, data:r.rows });
});

router.get('/executive-summary', requirePermission('reports','read'), async (req, res) => {
  const companyId=req.user!.companyId;
  const [props, leases, finance, maintenance] = await Promise.all([
    db.query(`SELECT COUNT(*) AS total_properties, SUM(current_value) AS total_asset_value FROM properties WHERE company_id=$1`,[companyId]),
    db.query(`SELECT COUNT(*) FILTER(WHERE status='active') AS active, SUM(monthly_rent) FILTER(WHERE status='active') AS monthly_rent FROM leases WHERE company_id=$1`,[companyId]),
    db.query(`SELECT SUM(vl.credit_amount) AS revenue FROM vouchers v JOIN voucher_lines vl ON vl.voucher_id=v.id JOIN chart_of_accounts coa ON coa.id=vl.account_id WHERE v.company_id=$1 AND v.status='posted' AND coa.account_type='income' AND DATE_TRUNC('month',v.date)=DATE_TRUNC('month',NOW())`,[companyId]),
    db.query(`SELECT COUNT(*) FILTER(WHERE status NOT IN ('completed','cancelled') AND priority IN ('critical','high')) AS urgent FROM work_orders WHERE company_id=$1`,[companyId]),
  ]);
  res.json({ success:true, data:{ properties:props.rows[0], leases:leases.rows[0], finance:finance.rows[0], maintenance:maintenance.rows[0] } });
});

export default router;
