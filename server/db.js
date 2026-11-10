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
const sslCaBase64 = process.env.DATABASE_SSL_CA_BASE64;

if (sslEnabled && !sslCaPath && !sslCaBase64) {
  throw new Error('Set DATABASE_SSL_CA to a local Supabase root CA certificate path or DATABASE_SSL_CA_BASE64 to its base64 contents when DATABASE_SSL=true.');
}

let ssl;
if (sslEnabled) {
  let ca;
  if (sslCaBase64) {
    ca = Buffer.from(sslCaBase64, 'base64').toString('utf8');
    if (!ca.includes('BEGIN CERTIFICATE')) {
      throw new Error('DATABASE_SSL_CA_BASE64 does not contain a valid PEM certificate.');
    }
  } else {
    const absoluteCaPath = resolve(process.cwd(), sslCaPath);
    try {
      ca = readFileSync(absoluteCaPath, 'utf8');
    } catch (error) {
      throw new Error(`Could not read DATABASE_SSL_CA at ${absoluteCaPath}: ${error.message}`);
    }
  }
  ssl = { ca, rejectUnauthorized: true };
}

const poolOptions = {
  connectionString: process.env.DATABASE_URL,
  ssl,
  // Vercel may run multiple instances; keep each instance to one DB client.
  max: Math.max(1, Number.parseInt(process.env.PG_POOL_MAX || '1', 10)),
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000
};

export const pool = globalThis.__sastaBazaarPgPool || new Pool(poolOptions);
globalThis.__sastaBazaarPgPool = pool;

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
