import { Pool } from 'pg';

// Ensure we reuse the same connection in development
declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = global.pgPool ?? new Pool({
  connectionString,
});

if (!global.pgPool) {
  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
  });
}

if (process.env.NODE_ENV !== 'production') {
  global.pgPool = pool;
}

export default pool;
