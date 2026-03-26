import { db } from '../config/database';
import { logger } from '../utils/logger';
import { io } from '../server';
import { EmailService } from './email.service';
import { SMSService } from './sms.service';

export class NotificationService {
  static async create(params: {
    companyId: string;
    userId?: string;
    type: string;
    title: string;
    body: string;
    entityType?: string;
    entityId?: string;
    channel?: 'app' | 'email' | 'sms' | 'all';
    priority?: 'critical' | 'high' | 'normal' | 'low';
    metadata?: Record<string, unknown>;
  }) {
    const { companyId, userId, type, title, body, entityType, entityId,
            channel = 'app', priority = 'normal', metadata = {} } = params;

    const result = await db.query(
      `INSERT INTO notifications (company_id, user_id, type, title, body,
        entity_type, entity_id, channel, priority, metadata, sent_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
       RETURNING *`,
      [companyId, userId, type, title, body, entityType, entityId, channel, priority, JSON.stringify(metadata)]
    );

    const notification = result.rows[0];

    // Push real-time via WebSocket
    io.to(`company:${companyId}`).emit('notification', notification);
    if (userId) io.to(`user:${userId}`).emit('notification', notification);

    // Email notification
    if ((channel === 'email' || channel === 'all') && userId) {
      const user = await db.query('SELECT email, first_name FROM users WHERE id = $1', [userId]);
      if (user.rows[0]?.email) {
        await EmailService.send({
          to: user.rows[0].email,
          subject: title,
          text: body,
          template: 'notification',
          data: { name: user.rows[0].first_name, title, body, ...metadata },
        }).catch((err) => logger.error('Email send failed:', err));
      }
    }

    // SMS notification
    if ((channel === 'sms' || channel === 'all') && userId) {
      const user = await db.query('SELECT phone FROM users WHERE id = $1', [userId]);
      if (user.rows[0]?.phone) {
        await SMSService.send(user.rows[0].phone, `${title}: ${body}`)
          .catch((err) => logger.error('SMS send failed:', err));
      }
    }

    return notification;
  }

  static async notifyApprovers(
    companyId: string,
    entityType: string,
    entityId: string,
    reference: string,
    amount: number
  ) {
    // Find users with approve permission
    const approvers = await db.query(
      `SELECT DISTINCT u.id, u.email, u.phone, u.first_name
       FROM users u
       JOIN user_company_roles ucr ON ucr.user_id = u.id
       JOIN roles r ON r.id = ucr.role_id
       WHERE ucr.company_id = $1
         AND r.permissions->>'finance' IS NOT NULL
         AND (r.permissions->'finance' ? 'approve' OR r.permissions->'finance' ? '*')`,
      [companyId]
    );

    for (const approver of approvers.rows) {
      await this.create({
        companyId,
        userId: approver.id,
        type: 'approval_required',
        title: `Approval Required: ${reference}`,
        body: `${entityType} ${reference} for ₹${amount.toLocaleString('en-IN')} requires your approval.`,
        entityType,
        entityId,
        channel: 'all',
        priority: amount > 1000000 ? 'high' : 'normal',
        metadata: { reference, amount },
      });
    }
  }

  static async leaseRenewalAlert(companyId: string, leases: Array<{ id: string; lease_number: string; end_date: string; unit_id: string }>) {
    for (const lease of leases) {
      await this.create({
        companyId,
        type: 'lease_renewal',
        title: `Lease Renewal Due: ${lease.lease_number}`,
        body: `Lease ${lease.lease_number} expires on ${lease.end_date}. Action required.`,
        entityType: 'lease',
        entityId: lease.id,
        channel: 'all',
        priority: 'high',
      });
    }
  }
}
