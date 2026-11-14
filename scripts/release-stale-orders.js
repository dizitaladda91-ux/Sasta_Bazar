import 'dotenv/config';
import { pool } from '../server/db.js';
import { releaseStaleOrders } from '../server/services/orders.js';

try {
  const summary = await releaseStaleOrders();
  console.info(JSON.stringify(summary));
} finally {
  await pool.end();
}
