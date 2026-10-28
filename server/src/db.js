import pg from 'pg';

// Connection settings come from the standard PG* variables
// (PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD), which `pg` reads on its own.
// A single DATABASE_URL still works if you prefer a connection string.
const config = process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {};

export const pool = new pg.Pool(config);
export const query = (text, params) => pool.query(text, params);
