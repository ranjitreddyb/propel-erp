import { db } from '../config/database';
import { logger } from '../utils/logger';
export async function auditLog(userId: string, companyId: string, action: string, entityType: string, entityId: string, oldData: unknown, newData: unknown) {
  try {
    await db.query(`INSERT INTO audit_logs (user_id,company_id,action,entity_type,entity_id,old_data,new_data) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb)`,
      [userId, companyId, action, entityType, entityId, oldData ? JSON.stringify(oldData) : null, newData ? JSON.stringify(newData) : null]);
  } catch(err) { logger.error('Audit log failed:', err); }
}
