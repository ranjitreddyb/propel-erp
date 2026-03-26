import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env: ${key}`);
  return val;
}

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000'),
  FRONTEND_URL: process.env.APP_URL || 'http://localhost:3000',

  // Database
  DATABASE_URL: required('DATABASE_URL'),
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  MONGODB_URI: process.env.MONGODB_URI || '',

  // Auth
  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // AWS
  AWS_REGION: process.env.AWS_REGION || 'ap-south-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || 'propel-erp-docs',

  // Email
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@wisewit.ai',

  // SMS - Brevo (formerly Sendinblue)
  BREVO_API_KEY: process.env.BREVO_API_KEY || '',
  SMS_SENDER_NAME: process.env.SMS_SENDER_NAME || 'PROPEL',

  // AI
  AI_ENGINE_URL: process.env.AI_ENGINE_URL || 'http://localhost:8000',
  EMERGENT_LLM_KEY: process.env.EMERGENT_LLM_KEY || '',

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};
