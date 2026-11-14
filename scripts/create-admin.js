import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool, query } from '../server/db.js';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set.');
}
if (password.length < 8) {
  throw new Error('ADMIN_PASSWORD must be at least 8 characters long.');
}

try {
  const passwordHash = await bcrypt.hash(password, 12);
  await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ('Store Admin', $1, $2, 'admin')
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash, role = 'admin', updated_at = NOW()`,
    [email, passwordHash]
  );
  console.info(`Administrator account created or updated for ${email}.`);
} finally {
  await pool.end();
}
