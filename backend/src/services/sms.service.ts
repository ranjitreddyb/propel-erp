import { logger } from '../utils/logger';
export class SMSService {
  static async send(phone: string, message: string) {
    logger.info(`📱 SMS queued → ${phone}`);
    // TODO: integrate MSG91
  }
}
