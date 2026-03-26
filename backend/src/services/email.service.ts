import { logger } from '../utils/logger';
export class EmailService {
  static async send(opts: { to: string; subject: string; text: string; template?: string; data?: Record<string,unknown> }) {
    logger.info(`📧 Email queued → ${opts.to}: ${opts.subject}`);
    // TODO: integrate SendGrid
  }
}
