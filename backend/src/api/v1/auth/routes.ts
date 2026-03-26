import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../../../config/database';
import { AppError } from '../../../utils/AppError';
import { config } from '../../../config/env';
import { validate } from '../../../middleware/validate';
import { logger } from '../../../utils/logger';

const router = Router();

// In-memory OTP store (use Redis in production)
const otpStore = new Map<string, { otp: string; expiresAt: Date; attempts: number }>();

// === Schemas ===
const sendOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
});

const verifyOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

// === Send OTP ===
router.post('/send-otp', validate(sendOtpSchema), async (req, res) => {
  const { phone } = req.body;
  
  // Check if user exists with this phone
  const user = await db.query(
    'SELECT id, first_name, phone, is_active FROM users WHERE phone = $1',
    [phone]
  );
  
  if (!user.rows[0]) {
    throw new AppError('Mobile number not registered. Contact admin.', 404);
  }
  
  if (!user.rows[0].is_active) {
    throw new AppError('Account is disabled. Contact admin.', 403);
  }

  // Generate OTP - Using 121212 for demo/testing (mock Brevo)
  const otp = config.NODE_ENV === 'production' && config.BREVO_API_KEY 
    ? Math.floor(100000 + Math.random() * 900000).toString()
    : '121212'; // Mock OTP for demo

  // Store OTP with 5-minute expiry
  otpStore.set(phone, {
    otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    attempts: 0,
  });

  // Send OTP via Brevo SMS (mocked for now)
  if (config.NODE_ENV === 'production' && config.BREVO_API_KEY) {
    // TODO: Integrate Brevo SMS API
    logger.info(`📱 OTP sent to ${phone}: ${otp}`);
  } else {
    logger.info(`📱 [MOCK] OTP for ${phone}: ${otp}`);
  }

  res.json({
    success: true,
    message: 'OTP sent successfully',
    expiresIn: 300, // 5 minutes
    // Only include OTP in response during development for testing
    ...(config.NODE_ENV !== 'production' && { debugOtp: otp }),
  });
});

// === Verify OTP & Login ===
router.post('/verify-otp', validate(verifyOtpSchema), async (req, res) => {
  const { phone, otp } = req.body;

  // Check stored OTP
  const stored = otpStore.get(phone);
  if (!stored) {
    throw new AppError('OTP expired or not requested. Please request a new OTP.', 400);
  }

  // Check expiry
  if (new Date() > stored.expiresAt) {
    otpStore.delete(phone);
    throw new AppError('OTP expired. Please request a new OTP.', 400);
  }

  // Check attempts (max 3)
  if (stored.attempts >= 3) {
    otpStore.delete(phone);
    throw new AppError('Too many failed attempts. Please request a new OTP.', 429);
  }

  // Verify OTP
  if (stored.otp !== otp) {
    stored.attempts++;
    throw new AppError(`Invalid OTP. ${3 - stored.attempts} attempts remaining.`, 401);
  }

  // OTP verified - clear it
  otpStore.delete(phone);

  // Get user
  const user = await db.query(
    'SELECT * FROM users WHERE phone = $1 AND is_active = true',
    [phone]
  );

  if (!user.rows[0]) {
    throw new AppError('User not found', 404);
  }

  // Get user's companies and roles
  const companies = await db.query(
    `SELECT c.id, c.name, c.code, c.currency, c.logo_url, ucr.role_id, r.name as role_name, r.permissions
     FROM user_company_roles ucr
     JOIN companies c ON c.id = ucr.company_id
     JOIN roles r ON r.id = ucr.role_id
     WHERE ucr.user_id = $1 AND ucr.is_active = true AND c.is_active = true`,
    [user.rows[0].id]
  );

  if (!companies.rows.length) {
    throw new AppError('No company access. Contact admin.', 403);
  }

  const company = companies.rows[0];

  // Generate JWT
  const token = jwt.sign(
    {
      id: user.rows[0].id,
      phone,
      email: user.rows[0].email,
      companyId: company.id,
      roleId: company.role_id,
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );

  // Update last login
  await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.rows[0].id]);

  logger.info(`✅ User logged in: ${phone} (${user.rows[0].first_name})`);

  res.json({
    success: true,
    token,
    user: {
      id: user.rows[0].id,
      firstName: user.rows[0].first_name,
      lastName: user.rows[0].last_name,
      email: user.rows[0].email,
      phone: user.rows[0].phone,
      avatarUrl: user.rows[0].avatar_url,
      isSuperAdmin: user.rows[0].is_superadmin,
    },
    company: {
      id: company.id,
      name: company.name,
      code: company.code,
      currency: company.currency,
      logoUrl: company.logo_url,
      roleId: company.role_id,
      roleName: company.role_name,
      permissions: company.permissions,
    },
    companies: companies.rows.map((c: any) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      currency: c.currency,
      roleId: c.role_id,
      roleName: c.role_name,
    })),
  });
});

// === Resend OTP ===
router.post('/resend-otp', validate(sendOtpSchema), async (req, res) => {
  const { phone } = req.body;
  
  // Clear existing OTP
  otpStore.delete(phone);
  
  // Redirect to send-otp logic
  req.body.phone = phone;
  
  // Check if user exists
  const user = await db.query(
    'SELECT id, is_active FROM users WHERE phone = $1',
    [phone]
  );
  
  if (!user.rows[0] || !user.rows[0].is_active) {
    throw new AppError('Mobile number not registered or account disabled.', 404);
  }

  // Generate new OTP
  const otp = config.NODE_ENV === 'production' && config.BREVO_API_KEY 
    ? Math.floor(100000 + Math.random() * 900000).toString()
    : '121212';

  otpStore.set(phone, {
    otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    attempts: 0,
  });

  logger.info(`📱 [RESEND] OTP for ${phone}: ${otp}`);

  res.json({
    success: true,
    message: 'OTP resent successfully',
    expiresIn: 300,
    ...(config.NODE_ENV !== 'production' && { debugOtp: otp }),
  });
});

// === Switch Company (for multi-company users) ===
router.post('/switch-company', async (req, res) => {
  const { companyId } = req.body;
  const authHeader = req.headers.authorization;
  
  if (!authHeader) throw new AppError('Authentication required', 401);
  
  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, config.JWT_SECRET) as any;

  // Verify user has access to requested company
  const access = await db.query(
    `SELECT c.id, c.name, c.code, c.currency, c.logo_url, ucr.role_id, r.name as role_name, r.permissions
     FROM user_company_roles ucr
     JOIN companies c ON c.id = ucr.company_id
     JOIN roles r ON r.id = ucr.role_id
     WHERE ucr.user_id = $1 AND ucr.company_id = $2 AND ucr.is_active = true`,
    [decoded.id, companyId]
  );

  if (!access.rows[0]) {
    throw new AppError('Access denied to this company', 403);
  }

  const company = access.rows[0];

  // Generate new token with updated company
  const newToken = jwt.sign(
    {
      id: decoded.id,
      phone: decoded.phone,
      email: decoded.email,
      companyId: company.id,
      roleId: company.role_id,
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );

  res.json({
    success: true,
    token: newToken,
    company: {
      id: company.id,
      name: company.name,
      code: company.code,
      currency: company.currency,
      logoUrl: company.logo_url,
      roleId: company.role_id,
      roleName: company.role_name,
      permissions: company.permissions,
    },
  });
});

// === Logout ===
router.post('/logout', (_req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// === Get Current User ===
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new AppError('Authentication required', 401);
  
  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, config.JWT_SECRET) as any;

  const user = await db.query(
    'SELECT id, first_name, last_name, email, phone, avatar_url, is_superadmin FROM users WHERE id = $1',
    [decoded.id]
  );

  if (!user.rows[0]) throw new AppError('User not found', 404);

  res.json({ success: true, user: user.rows[0] });
});

export default router;
