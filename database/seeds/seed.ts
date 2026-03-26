import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const db = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  console.log('🌱 Seeding PropelERP...');

  // Create company
  const co = await db.query(`
    INSERT INTO companies (code, name, currency, fiscal_year_start) 
    VALUES ('PRESTIGE', 'Prestige Properties Ltd', 'INR', 4) 
    ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name 
    RETURNING id
  `);
  const companyId = co.rows[0].id;

  // Create admin user with phone number for OTP login
  const hash = await bcrypt.hash('PropelAdmin@2026', 12);
  const u = await db.query(`
    INSERT INTO users (email, password_hash, first_name, last_name, phone, is_superadmin) 
    VALUES ('admin@wisewit.ai', $1, 'System', 'Administrator', '9999999999', true) 
    ON CONFLICT (email) DO UPDATE SET 
      password_hash = EXCLUDED.password_hash,
      phone = EXCLUDED.phone
    RETURNING id
  `, [hash]);

  // Create Super Administrator role
  const r = await db.query(`
    INSERT INTO roles (company_id, name, permissions, is_system) 
    VALUES ($1, 'Super Administrator', '{"*":["*"]}', true) 
    ON CONFLICT DO NOTHING
    RETURNING id
  `, [companyId]);

  // If role already exists, fetch it
  let roleId = r.rows[0]?.id;
  if (!roleId) {
    const existingRole = await db.query(
      `SELECT id FROM roles WHERE company_id = $1 AND name = 'Super Administrator'`,
      [companyId]
    );
    roleId = existingRole.rows[0]?.id;
  }

  // Assign role to user
  await db.query(`
    INSERT INTO user_company_roles (user_id, company_id, role_id) 
    VALUES ($1, $2, $3) 
    ON CONFLICT (user_id, company_id) DO UPDATE SET role_id = EXCLUDED.role_id
  `, [u.rows[0].id, companyId, roleId]);

  // Create financial year
  await db.query(`
    INSERT INTO financial_years (company_id, year_code, start_date, end_date, is_current) 
    VALUES ($1, 'FY2025-26', '2025-04-01', '2026-03-31', true) 
    ON CONFLICT DO NOTHING
  `, [companyId]);

  // Create a demo property
  await db.query(`
    INSERT INTO properties (company_id, code, name, type, address, city, state, total_area_sqft, total_units)
    VALUES ($1, 'PROP001', 'Prestige Tech Park', 'commercial', 
      '{"line1": "Survey No. 115", "line2": "Outer Ring Road", "pincode": "560103"}',
      'Bengaluru', 'Karnataka', 250000, 100)
    ON CONFLICT (code) DO NOTHING
  `, [companyId]);

  // Create demo property units
  const propResult = await db.query(`SELECT id FROM properties WHERE code = 'PROP001'`);
  if (propResult.rows[0]) {
    const propertyId = propResult.rows[0].id;
    for (let floor = 1; floor <= 5; floor++) {
      for (let unit = 1; unit <= 4; unit++) {
        await db.query(`
          INSERT INTO property_units (property_id, unit_number, floor, unit_type, area_sqft, base_rent, status)
          VALUES ($1, $2, $3, 'office', $4, $5, $6)
          ON CONFLICT (property_id, unit_number) DO NOTHING
        `, [
          propertyId,
          `${floor}0${unit}`,
          floor,
          2500 + Math.random() * 1000,
          85000 + Math.random() * 15000,
          Math.random() > 0.3 ? 'occupied' : 'vacant'
        ]);
      }
    }
  }

  console.log('');
  console.log('✅ PropelERP Seeded Successfully!');
  console.log('');
  console.log('📱 OTP Login Credentials:');
  console.log('   Mobile: 9999999999');
  console.log('   OTP:    121212 (demo mode)');
  console.log('');
  console.log('👤 Admin User: admin@wisewit.ai');
  console.log('');

  await db.end();
}

seed().catch(console.error);
