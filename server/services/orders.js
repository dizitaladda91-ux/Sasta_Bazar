import { inTransaction, query } from '../db.js';
import { getStripe } from './stripe.js';

export async function syncProductStock(client, productId) {
  await client.query(
    `UPDATE products SET stock = (
       SELECT COALESCE(SUM(stock), 0)::int FROM variants WHERE product_id = $1
     ), updated_at = NOW()
     WHERE id = $1`,
    [productId]
  );
}

export async function restoreStock(client, orderId) {
  const orderResult = await client.query(
    'SELECT id, inventory_released FROM orders WHERE id = $1 FOR UPDATE',
    [orderId]
  );
  if (!orderResult.rowCount || orderResult.rows[0].inventory_released) return false;

  const items = await client.query(
    `SELECT variant_id, product_id, SUM(quantity)::int AS quantity
     FROM order_items WHERE order_id = $1 GROUP BY variant_id, product_id`,
    [orderId]
  );
  const productIds = new Set();
  for (const item of items.rows) {
    if (item.variant_id) {
      await client.query('UPDATE variants SET stock = stock + $2 WHERE id = $1', [item.variant_id, item.quantity]);
    } else {
      throw new Error(`Cannot restore order ${orderId}: a reserved product variant is missing.`);
    }
    productIds.add(String(item.product_id));
  }
  for (const productId of productIds) await syncProductStock(client, productId);
  await client.query('UPDATE orders SET inventory_released = TRUE WHERE id = $1', [orderId]);
  return true;
}

export const restoreOrderReservation = restoreStock;

export async function releaseStaleOrders({ olderThanMinutes = 30 } = {}) {
  if (!Number.isInteger(olderThanMinutes) || olderThanMinutes < 1) {
    throw new TypeError('olderThanMinutes must be a positive integer.');
  }

  const { rows } = await query(
    `SELECT id, order_ref, stripe_payment_intent_id
     FROM orders
     WHERE payment_status='Pending'
       AND created_at < NOW() - ($1::int * INTERVAL '1 minute')
     ORDER BY created_at`,
    [olderThanMinutes]
  );
  let stripe;
  let released = 0;

  for (const candidate of rows) {
    if (candidate.stripe_payment_intent_id) {
      stripe ||= getStripe();
      const intent = await stripe.paymentIntents.retrieve(candidate.stripe_payment_intent_id);
      if (intent.status === 'succeeded') continue;
      if (intent.status !== 'canceled') {
        try {
          const canceledIntent = await stripe.paymentIntents.cancel(candidate.stripe_payment_intent_id);
          if (canceledIntent.status === 'succeeded') continue;
          if (canceledIntent.status !== 'canceled') {
            throw new Error(`Stripe did not cancel payment intent ${candidate.stripe_payment_intent_id}.`);
          }
        } catch (cancelError) {
          let latestIntent;
          try {
            latestIntent = await stripe.paymentIntents.retrieve(candidate.stripe_payment_intent_id);
          } catch {
            throw cancelError;
          }
          if (latestIntent.status === 'succeeded') continue;
          if (latestIntent.status !== 'canceled') throw cancelError;
        }
      }
    }

    const restored = await inTransaction(async (client) => {
      const current = await client.query(
        'SELECT id, payment_status FROM orders WHERE id=$1 FOR UPDATE',
        [candidate.id]
      );
      if (!current.rowCount || current.rows[0].payment_status !== 'Pending') return false;
      await client.query(
        `UPDATE orders SET payment_status='Failed', order_status='Cancelled'
         WHERE id=$1`,
        [candidate.id]
      );
      return restoreStock(client, candidate.id);
    });
    if (restored) released += 1;
  }

  return { released };
}
