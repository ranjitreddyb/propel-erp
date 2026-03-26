import { Router } from 'express';
import { z } from 'zod';
import { db, paginatedQuery } from '../../../config/database';
import { requirePermission } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { AppError } from '../../../utils/AppError';
import { auditLog } from '../../../services/audit.service';
import bcrypt from 'bcryptjs';
const router = Router();

const createEmployeeSchema = z.object({
  firstName: z.string().min(1), lastName: z.string().optional(),
  email: z.string().email(), phone: z.string().optional(),
  department: z.string(), designation: z.string(),
  costCentreId: z.string().uuid().optional(), propertyId: z.string().uuid().optional(),
  reportsTo: z.string().uuid().optional(), joinDate: z.string(),
  employmentType: z.enum(["full_time","part_time","contract"]).default("full_time"),
  basicSalary: z.number().positive(), hra: z.number().default(0),
  pan: z.string().optional(),
});

router.get("/employees", requirePermission("hr","read"), async (req, res) => {
  const { page=1, pageSize=20, department, status='active', search } = req.query;
  const companyId = req.user!.companyId;
  let sql = `SELECT e.*, mgr.first_name||' '||COALESCE(mgr.last_name,'') AS manager_name,
    cc.name AS cost_centre_name FROM employees e
    LEFT JOIN employees mgr ON mgr.id=e.reports_to
    LEFT JOIN cost_centres cc ON cc.id=e.cost_centre_id
    WHERE e.company_id=$1 AND e.status=$2`;
  const params: unknown[] = [companyId, status]; let idx=3;
  if (department) { sql+=` AND e.department=$${idx++}`; params.push(department); }
  if (search) { sql+=` AND (e.first_name ILIKE $${idx} OR e.last_name ILIKE $${idx} OR e.email ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
  sql+=` ORDER BY e.department, e.first_name`;
  res.json({ success:true, ...(await paginatedQuery(sql, params, Number(page), Number(pageSize))) });
});

router.get("/employees/kpis", requirePermission("hr","read"), async (req, res) => {
  const companyId=req.user!.companyId;
  const r = await db.query(`SELECT COUNT(*) FILTER(WHERE status='active') AS total_active,
    COUNT(*) FILTER(WHERE status='active' AND employment_type='full_time') AS full_time,
    SUM(basic_salary+hra) FILTER(WHERE status='active') AS total_payroll,
    COUNT(DISTINCT department) AS departments FROM employees WHERE company_id=$1`,[companyId]);
  res.json({ success:true, data:r.rows[0] });
});

router.get("/employees/:id", requirePermission("hr","read"), async (req, res) => {
  const r = await db.query("SELECT * FROM employees WHERE id=$1 AND company_id=$2",[req.params.id,req.user!.companyId]);
  if (!r.rows[0]) throw new AppError("Employee not found",404);
  res.json({ success:true, data:r.rows[0] });
});

router.post("/employees", requirePermission("hr",'create'), validate(createEmployeeSchema), async (req, res) => {
  const companyId=req.user!.companyId, userId=req.user!.id;
  const seq = await db.query("SELECT COUNT(*)+1 AS n FROM employees WHERE company_id=$1",[companyId]);
  const employeeCode=`EMP-${String(seq.rows[0].n).padStart(4,"0")}`;
  const pwHash = await bcrypt.hash(`${req.body.firstName}@2026`,10);
  const u = await db.query(`INSERT INTO users (email,password_hash,first_name,last_name) VALUES ($1,$2,$3,$4)
    ON CONFLICT (email) DO UPDATE SET first_name=EXCLUDED.first_name RETURNING id`,
    [req.body.email,pwHash,req.body.firstName,req.body.lastName||null]);
  const r = await db.query(`INSERT INTO employees (company_id,employee_code,user_id,first_name,last_name,
    email,phone,department,designation,cost_centre_id,property_id,reports_to,join_date,employment_type,
    basic_salary,hra,pan,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'active') RETURNING *`,
    [companyId,employeeCode,u.rows[0].id,req.body.firstName,req.body.lastName||null,
     req.body.email,req.body.phone||null,req.body.department,req.body.designation,
     req.body.costCentreId||null,req.body.propertyId||null,req.body.reportsTo||null,
     req.body.joinDate,req.body.employmentType,req.body.basicSalary,req.body.hra||0,req.body.pan||null]);
  await auditLog(userId,companyId,'create','employee',r.rows[0].id,null,r.rows[0]);
  res.status(201).json({ success:true, data:r.rows[0] });
});

router.get("/attendance", requirePermission("hr","read"), async (req, res) => {
  const { date, employeeId } = req.query;
  const companyId=req.user!.companyId;
  let sql=`SELECT a.*, e.first_name, e.last_name, e.department, e.employee_code
    FROM attendance a JOIN employees e ON e.id=a.employee_id WHERE e.company_id=$1`;
  const params: unknown[]=[companyId]; let idx=2;
  if (date) { sql+=` AND a.date=$${idx++}`; params.push(date); }
  if (employeeId) { sql+=` AND a.employee_id=$${idx++}`; params.push(employeeId); }
  sql+=` ORDER BY a.date DESC LIMIT 500`;
  const r = await db.query(sql,params);
  res.json({ success:true, data:r.rows });
});

router.post("/payroll/run", requirePermission("hr","approve"), async (req, res) => {
  const { month, year } = req.body;
  const companyId=req.user!.companyId, userId=req.user!.id;
  const ex = await db.query("SELECT id FROM payroll_runs WHERE company_id=$1 AND month=$2 AND year=$3",[companyId,month,year]);
  if (ex.rows[0]) throw new AppError("Payroll already run for this period",409);
  const employees = await db.query("SELECT * FROM employees WHERE company_id=$1 AND status='active'",[companyId]);
  let totalGross=0, totalDeductions=0;
  for (const emp of employees.rows) {
    const gross = parseFloat(emp.basic_salary)+parseFloat(emp.hra||0);
    totalGross+=gross; totalDeductions+=gross*0.12;
  }
  const r = await db.query(`INSERT INTO payroll_runs (company_id,month,year,status,total_gross,total_deductions,total_net,processed_by)
    VALUES ($1,$2,$3,'draft',$4,$5,$6,$7) RETURNING *`,
    [companyId,month,year,totalGross,totalDeductions,totalGross-totalDeductions,userId]);
  res.json({ success:true, data:r.rows[0], summary:{ employees:employees.rows.length, totalGross, totalNet:totalGross-totalDeductions } });
});

export default router;
