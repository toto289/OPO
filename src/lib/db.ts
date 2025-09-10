import { Pool } from 'pg';

// Ensure we reuse the same connection in development
declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

const pool = global.pgPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
});

if (process.env.NODE_ENV !== 'production') {
  global.pgPool = pool;
}

export default pool;
