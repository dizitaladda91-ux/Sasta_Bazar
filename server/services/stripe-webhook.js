import { inTransaction } from '../db.js';
import { restoreOrderReservation } from './orders.js';

export async function processStripeEvent(event) {
  return inTransaction(async (client) => {
    const recorded = await client.query(
      `INSERT INTO stripe_events (event_id, type) VALUES ($1, $2)
       ON CONFLICT (event_id) DO NOTHING RETURNING event_id`,
      [event.id, event.type]
    );
    if (!recorded.rowCount) return false;

    const object = event.data.object;
    if (event.type === 'payment_intent.succeeded') {
      const order = await client.query(
        `UPDATE orders SET payment_status = 'Paid', order_status = 'Processing', paid_at = NOW()
         WHERE stripe_payment_intent_id = $1 AND payment_status = 'Pending'
         RETURNING coupon_id`,
        [object.id]
      );
      if (order.rows[0]?.coupon_id != null) {
        await client.query('UPDATE coupons SET redemption_count=redemption_count+1 WHERE id=$1', [order.rows[0].coupon_id]);
      }
    } else if (['payment_intent.payment_failed', 'payment_intent.canceled'].includes(event.type)) {
      const order = await client.query(
        `SELECT id FROM orders WHERE stripe_payment_intent_id = $1 AND payment_status = 'Pending'
         FOR UPDATE`,
        [object.id]
      );
      if (order.rowCount) {
        await client.query(
          `UPDATE orders SET payment_status = 'Failed', order_status = 'Cancelled'
           WHERE id = $1`,
          [order.rows[0].id]
        );
        await restoreOrderReservation(client, order.rows[0].id);
      }
    } else if (event.type === 'charge.refunded' && object.payment_intent) {
      const paymentIntentId = typeof object.payment_intent === 'string'
        ? object.payment_intent
        : object.payment_intent.id;
      const order = await client.query(
        `SELECT id, total, refunded_amount, order_status
         FROM orders WHERE stripe_payment_intent_id=$1 FOR UPDATE`,
        [paymentIntentId]
      );
      if (order.rowCount) {
        const row = order.rows[0];
        const refundedPence = Math.max(
          Math.round(Number(row.refunded_amount || 0) * 100),
          Number(object.amount_refunded || 0)
        );
        const totalPence = Math.round(Number(row.total) * 100);
        const fullyRefunded = refundedPence >= totalPence;
        const restoreInventory = fullyRefunded && !['Dispatched', 'Delivered'].includes(row.order_status);
        await client.query(
          `UPDATE orders SET refunded_amount=$2, payment_status=$3,
             order_status=CASE WHEN $3='Refunded' THEN 'Cancelled' ELSE order_status END
           WHERE id=$1`,
          [row.id, refundedPence / 100, fullyRefunded ? 'Refunded' : 'Paid']
        );
        if (restoreInventory) await restoreOrderReservation(client, row.id);
      }
    }
    return true;
  });
}
