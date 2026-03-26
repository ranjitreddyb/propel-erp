import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import { config } from './config/env';
import { logger } from './utils/logger';
import { connectPostgres } from './config/database';
import { connectRedis } from './config/redis';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { authMiddleware } from './middleware/auth';

// Route imports
import authRoutes from './api/v1/auth/routes';
import propertyRoutes from './api/v1/properties/routes';
import leasingRoutes from './api/v1/leasing/routes';
import financeRoutes from './api/v1/finance/routes';
import hrRoutes from './api/v1/hr/routes';
import maintenanceRoutes from './api/v1/maintenance/routes';
import facilityRoutes from './api/v1/facility/routes';
import procurementRoutes from './api/v1/procurement/routes';
import crmRoutes from './api/v1/crm/routes';
import reportsRoutes from './api/v1/reports/routes';
import aiRoutes from './api/v1/ai/routes';
import workflowRoutes from './api/v1/workflow/routes';
import documentRoutes from './api/v1/documents/routes';
import userRoutes from './api/v1/users/routes';
import notificationRoutes from './api/v1/notifications/routes';

const app = express();
const httpServer = createServer(app);

// ─── WebSocket for real-time notifications ────────────────
export const io = new SocketServer(httpServer, {
  cors: { origin: config.FRONTEND_URL, credentials: true }
});

io.on('connection', (socket) => {
  socket.on('join_company', (companyId: string) => {
    socket.join(`company:${companyId}`);
  });
});

// ─── Middleware ───────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: [config.FRONTEND_URL, 'https://propelerp.wisewit.ai'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(rateLimiter);

// ─── Health Check ─────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'PropelERP API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes (v1) ─────────────────────────────────────
const v1 = '/api/v1';
app.use(`${v1}/auth`, authRoutes);
app.use(`${v1}/properties`, authMiddleware, propertyRoutes);
app.use(`${v1}/leasing`, authMiddleware, leasingRoutes);
app.use(`${v1}/finance`, authMiddleware, financeRoutes);
app.use(`${v1}/hr`, authMiddleware, hrRoutes);
app.use(`${v1}/maintenance`, authMiddleware, maintenanceRoutes);
app.use(`${v1}/facility`, authMiddleware, facilityRoutes);
app.use(`${v1}/procurement`, authMiddleware, procurementRoutes);
app.use(`${v1}/crm`, authMiddleware, crmRoutes);
app.use(`${v1}/reports`, authMiddleware, reportsRoutes);
app.use(`${v1}/ai`, authMiddleware, aiRoutes);
app.use(`${v1}/workflow`, authMiddleware, workflowRoutes);
app.use(`${v1}/documents`, authMiddleware, documentRoutes);
app.use(`${v1}/users`, authMiddleware, userRoutes);
app.use(`${v1}/notifications`, authMiddleware, notificationRoutes);

// ─── Error Handler ────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────
async function bootstrap() {
  await connectPostgres();
  await connectRedis();
  httpServer.listen(config.PORT, () => {
    logger.info(`✅ PropelERP API running on port ${config.PORT}`);
    logger.info(`📡 WebSocket server ready`);
    logger.info(`🌍 Environment: ${config.NODE_ENV}`);
  });
}

bootstrap().catch((err) => {
  logger.error('❌ Failed to start server:', err);
  process.exit(1);
});

export default app;
