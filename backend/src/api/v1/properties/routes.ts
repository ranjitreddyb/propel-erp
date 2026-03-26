import { Router } from 'express';
import { z } from 'zod';
import { db, paginatedQuery } from '../../../config/database';
import { requirePermission } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { AppError } from '../../../utils/AppError';
import { auditLog } from '../../../services/audit.service';

const router = Router();

// ─── Validation Schemas ───────────────────────────────────
const createPropertySchema = z.object({
  code: z.string().min(2).max(30),
  name: z.string().min(2).max(255),
  type: z.enum(['commercial', 'residential', 'retail', 'industrial', 'mixed']),
  address: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
  }),
  totalAreaSqft: z.number().positive().optional(),
  totalUnits: z.number().int().optional(),
  purchaseDate: z.string().optional(),
  purchaseValue: z.number().optional(),
  amenities: z.array(z.string()).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// ─── GET /properties ─────────────────────────────────────
router.get('/', requirePermission('properties', 'read'), async (req, res) => {
  const { page = 1, pageSize = 20, type, status, search } = req.query;
  const companyId = req.user!.companyId;

  let sql = `
    SELECT 
      p.*,
      COUNT(DISTINCT pu.id) AS total_units,
      COUNT(DISTINCT pu.id) FILTER (WHERE pu.status = 'occupied') AS occupied_units,
      ROUND(
        COUNT(DISTINCT pu.id) FILTER (WHERE pu.status = 'occupied')::numeric /
        NULLIF(COUNT(DISTINCT pu.id), 0) * 100, 1
      ) AS occupancy_rate
    FROM properties p
    LEFT JOIN property_units pu ON pu.property_id = p.id
    WHERE p.company_id = $1
  `;
  const params: unknown[] = [companyId];
  let paramIndex = 2;

  if (type) {
    sql += ` AND p.type = $${paramIndex++}`;
    params.push(type);
  }
  if (search) {
    sql += ` AND (p.name ILIKE $${paramIndex} OR p.code ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }
  sql += ` GROUP BY p.id ORDER BY p.created_at DESC`;

  const result = await paginatedQuery(sql, params, Number(page), Number(pageSize));
  res.json({ success: true, ...result });
});

// ─── GET /properties/:id ──────────────────────────────────
router.get('/:id', requirePermission('properties', 'read'), async (req, res) => {
  const { id } = req.params;
  const companyId = req.user!.companyId;

  const property = await db.query(
    `SELECT p.*, 
      json_agg(DISTINCT pu.*) FILTER (WHERE pu.id IS NOT NULL) AS units
     FROM properties p
     LEFT JOIN property_units pu ON pu.property_id = p.id
     WHERE p.id = $1 AND p.company_id = $2
     GROUP BY p.id`,
    [id, companyId]
  );
  if (!property.rows[0]) throw new AppError('Property not found', 404);
  res.json({ success: true, data: property.rows[0] });
});

// ─── POST /properties ─────────────────────────────────────
router.post(
  '/',
  requirePermission('properties', 'create'),
  validate(createPropertySchema),
  async (req, res) => {
    const companyId = req.user!.companyId;
    const {
      code, name, type, address, totalAreaSqft,
      totalUnits, purchaseDate, purchaseValue, amenities, latitude, longitude
    } = req.body;

    const existing = await db.query(
      'SELECT id FROM properties WHERE code = $1 AND company_id = $2',
      [code, companyId]
    );
    if (existing.rows[0]) throw new AppError('Property code already exists', 409);

    const result = await db.query(
      `INSERT INTO properties (
        company_id, code, name, type, address, city, state, pincode,
        total_area_sqft, total_units, purchase_date, purchase_value,
        amenities, latitude, longitude
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *`,
      [
        companyId, code, name, type, JSON.stringify(address),
        address.city, address.state, address.pincode,
        totalAreaSqft, totalUnits, purchaseDate, purchaseValue,
        amenities, latitude, longitude,
      ]
    );

    await auditLog(req.user!.id, companyId, 'create', 'property', result.rows[0].id, null, result.rows[0]);
    res.status(201).json({ success: true, data: result.rows[0] });
  }
);

// ─── PUT /properties/:id ──────────────────────────────────
router.put(
  '/:id',
  requirePermission('properties', 'update'),
  async (req, res) => {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const existing = await db.query(
      'SELECT * FROM properties WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    if (!existing.rows[0]) throw new AppError('Property not found', 404);

    const fields = req.body;
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const allowedFields = ['name', 'type', 'address', 'total_area_sqft', 'current_value', 'amenities', 'is_active'];
    for (const field of allowedFields) {
      const camelField = field.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
      if (fields[camelField] !== undefined) {
        setClauses.push(`${field} = $${idx++}`);
        values.push(fields[camelField]);
      }
    }
    if (!setClauses.length) throw new AppError('No fields to update', 400);

    values.push(id);
    const result = await db.query(
      `UPDATE properties SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $${idx} RETURNING *`,
      values
    );

    await auditLog(req.user!.id, companyId, 'update', 'property', id, existing.rows[0], result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  }
);

// ─── GET /properties/:id/units ────────────────────────────
router.get('/:id/units', requirePermission('properties', 'read'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.query;

  let sql = 'SELECT * FROM property_units WHERE property_id = $1';
  const params: unknown[] = [id];
  if (status) { sql += ' AND status = $2'; params.push(status); }
  sql += ' ORDER BY floor, unit_number';

  const result = await db.query(sql, params);
  res.json({ success: true, data: result.rows });
});

// ─── GET /properties/summary/kpis ─────────────────────────
router.get('/summary/kpis', requirePermission('properties', 'read'), async (req, res) => {
  const companyId = req.user!.companyId;
  const result = await db.query(
    `SELECT
      COUNT(DISTINCT p.id) AS total_properties,
      COUNT(pu.id) AS total_units,
      COUNT(pu.id) FILTER (WHERE pu.status = 'occupied') AS occupied_units,
      SUM(p.total_area_sqft) AS total_area,
      SUM(p.current_value) AS total_asset_value,
      ROUND(
        COUNT(pu.id) FILTER (WHERE pu.status = 'occupied')::numeric /
        NULLIF(COUNT(pu.id), 0) * 100, 1
      ) AS occupancy_rate
     FROM properties p
     LEFT JOIN property_units pu ON pu.property_id = p.id
     WHERE p.company_id = $1 AND p.is_active = true`,
    [companyId]
  );
  res.json({ success: true, data: result.rows[0] });
});

export default router;
