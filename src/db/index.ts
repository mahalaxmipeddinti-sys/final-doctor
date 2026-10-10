// src/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

export const isDatabaseConfigured = Boolean(
  process.env.SQL_HOST && process.env.SQL_USER && process.env.SQL_DB_NAME
);

// Function to create or retrieve the connection pool.
export const createPool = () => {
  if (!global._postgresPool) {
    if (isDatabaseConfigured) {
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        max: 10,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
      });

      // Prevent unhandled pool-level errors from crashing the application
      global._postgresPool.on('error', (err) => {
        console.warn('PostgreSQL idle client disconnected or pool warning:', err?.message || err);
      });
    } else {
      // Lazy placeholder pool when Cloud SQL is not provisioned yet
      global._postgresPool = new Pool({
        host: '127.0.0.1',
        connectionTimeoutMillis: 1000,
      });
      global._postgresPool.on('error', () => {
        // Suppress idle errors when database is unconfigured
      });
    }
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance.
const pool = createPool();

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
