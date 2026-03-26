import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';
export const validate = (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
  const r = schema.safeParse(req.body);
  if (!r.success) throw new AppError(`Validation: ${r.error.errors.map(e=>e.message).join(', ')}`, 400);
  req.body = r.data; next();
};
