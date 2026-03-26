import { Pool } from 'pg';
import { config } from './env';
import { logger } from '../utils/logger';

export const db = new Pool({
  connectionString: config.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: false,  // Docker PostgreSQL doesn't need SSL
});

export async function connectPostgres(): Promise<void> {
  try {
    const client = await db.connect();
    const result = await client.query('SELECT version()');
    client.release();
    logger.info(`✅ PostgreSQL connected: ${result.rows[0].version.split(' ')[1]}`);
  } catch (err) {
    logger.error('❌ PostgreSQL connection failed:', err);
    throw err;
  }
}

// Helper: paginated query
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function paginatedQuery<T>(
  sql: string,
  params: unknown[],
  page = 1,
  pageSize = 20
): Promise<PaginatedResult<T>> {
  const offset = (page - 1) * pageSize;
  const countResult = await db.query(
    `SELECT COUNT(*) FROM (${sql}) AS count_query`,
    params
  );
  const total = parseInt(countResult.rows[0].count);
  const dataResult = await db.query<T>(
    `${sql} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, pageSize, offset]
  );
  return {
    data: dataResult.rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
