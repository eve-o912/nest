// Database connection pool and utilities
import { Pool } from '@neondatabase/serverless';
import { logger } from './retry';

// Lazy initialization - pool created on first use
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

// Health check for database
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const client = await getPool().connect();
    try {
      await client.query('SELECT 1');
      return { healthy: true, latency: Date.now() - start };
    } finally {
      client.release();
    }
  } catch (err) {
    return {
      healthy: false,
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

// Execute with automatic connection management
export async function withPool<T>(
  operation: (client: any) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    return await operation(client);
  } finally {
    client.release();
  }
}

// Transaction wrapper with pool
export async function withTransaction<T>(
  operation: (trx: any) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// Typed query helper
export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  return withPool(async (client) => {
    const result = await client.query(sql, params);
    return result.rows;
  });
}

// Single row query helper
export async function queryOne<T = any>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] || null;
}

// Graceful shutdown helper
export async function closePool(): Promise<void> {
  if (pool) {
    logger.info('Closing database pool...');
    await pool.end();
    pool = null;
    logger.info('Database pool closed');
  }
}

// SQL tagged template (for migrations/DDL)
export function sql(strings: TemplateStringsArray, ...values: any[]) {
  const text = strings.reduce((acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ''), '');
  return { text, values };
}

export { getPool, pool };
