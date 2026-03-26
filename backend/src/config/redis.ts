import { Redis } from 'ioredis';
import { config } from './env';
import { logger } from '../utils/logger';
export const redis = new Redis(config.REDIS_URL, { lazyConnect: true });
export async function connectRedis() { await redis.connect(); logger.info('✅ Redis connected'); }
export const cacheGet = async <T>(key: string): Promise<T|null> => { const v = await redis.get(key); return v ? JSON.parse(v) : null; };
export const cacheSet = (key: string, val: unknown, ttl = 300) => redis.setex(key, ttl, JSON.stringify(val));
export const cacheDel = (key: string) => redis.del(key);
