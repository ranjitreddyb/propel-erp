import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AppError } from '../utils/AppError';
import { db } from '../config/database';

export interface AuthUser {
  id: string;
  email: string;
  companyId: string;
  roleId: string;
  permissions: Record<string, string[]>;
  isSuperAdmin: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new AppError('Authentication required', 401);

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as AuthUser;
    // Re-fetch permissions from DB for security (cached via Redis in production)
    const result = await db.query(
      `SELECT ucr.*, r.permissions, u.is_superadmin
       FROM user_company_roles ucr
       JOIN roles r ON r.id = ucr.role_id
       JOIN users u ON u.id = ucr.user_id
       WHERE ucr.user_id = $1 AND ucr.company_id = $2 AND ucr.is_active = true`,
      [decoded.id, decoded.companyId]
    );
    if (!result.rows[0]) throw new AppError('Access denied', 403);
    req.user = {
      ...decoded,
      permissions: result.rows[0].permissions,
      isSuperAdmin: result.rows[0].is_superadmin,
    };
    next();
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Invalid or expired token', 401);
  }
};

// Permission guard factory
export const requirePermission = (module: string, action: string) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user!;
    if (user.isSuperAdmin) return next();
    const allowed = user.permissions[module] || [];
    if (!allowed.includes(action) && !allowed.includes('*')) {
      throw new AppError(`Insufficient permissions: ${module}.${action}`, 403);
    }
    next();
  };
};
