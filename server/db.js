import 'dotenv/config';
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set before starting the API server.');
}

const sslEnabled = process.env.DATABASE_SSL === 'true';
const sslCaPath = process.env.DATABASE_SSL_CA;

if (sslEnabled && !sslCaPath) {
  throw new Error('DATABASE_SSL_CA must point to the Supabase root CA certificate when DATABASE_SSL=true. Download it from Supabase Dashboard → Database Settings → SSL Configuration.');
}

let ssl;
if (sslEnabled) {
  const absoluteCaPath = resolve(process.cwd(), sslCaPath);
  try {
    ssl = {
      ca: readFileSync(absoluteCaPath, 'utf8'),
      rejectUnauthorized: true
    };
  } catch (error) {
    throw new Error(`Could not read DATABASE_SSL_CA at ${absoluteCaPath}: ${error.message}`);
  }
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl
});

export const query = (text, values) => pool.query(text, values);

export async function inTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
