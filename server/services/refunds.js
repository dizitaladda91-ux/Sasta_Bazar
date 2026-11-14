import { inTransaction } from '../db.js';
import { restoreOrderReservation } from './orders.js';
import { getStripe } from './stripe.js';

export async function issueOrderRefund(orderRef, { amount, reason } = {}) {
  return inTransaction(async (client) => {
    const result = await client.query(
      `SELECT id, order_ref, total, refunded_amount, stripe_payment_intent_id, payment_status, order_status
       FROM orders WHERE LOWER(order_ref)=LOWER($1) FOR UPDATE`,
      [orderRef]
    );
    if (!result.rowCount) return { error: { status: 404, message: 'Order not found.' } };
    const order = result.rows[0];
    const requestedPence = amount === undefined ? undefined : Math.round(amount * 100);
    const idempotencyKey = `refund-${order.order_ref}-${requestedPence === undefined ? 'full' : (requestedPence / 100).toFixed(2)}`;
    const previous = await client.query(
      'SELECT stripe_refund_id, amount FROM order_refunds WHERE idempotency_key=$1',
      [idempotencyKey]
    );
    if (previous.rowCount) {
      return {
        refundId: previous.rows[0].stripe_refund_id,
        amount: Number(previous.rows[0].amount),
        fullyRefunded: order.payment_status === 'Refunded',
        duplicate: true
      };
    }

    if (order.payment_status !== 'Paid' || !order.stripe_payment_intent_id) {
      return { error: { status: 409, message: 'Only paid Stripe orders can be refunded.' } };
    }

    const totalPence = Math.round(Number(order.total) * 100);
    const refundedPence = Math.round(Number(order.refunded_amount || 0) * 100);
    const remainingPence = totalPence - refundedPence;
    const amountPence = requestedPence === undefined ? remainingPence : requestedPence;
    if (amountPence <= 0 || amountPence > remainingPence) {
      return {
        error: {
          status: 400,
          message: 'Refund amount must be greater than zero and no more than the remaining balance.'
        }
      };
    }

    let refund;
    try {
      refund = await getStripe().refunds.create({
        payment_intent: order.stripe_payment_intent_id,
        amount: amountPence,
        ...(reason ? { reason } : {})
      }, { idempotencyKey });
    } catch (error) {
      return {
        error: {
          status: Number.isInteger(error.statusCode)
            ? error.statusCode
            : Number.isInteger(error.status) ? error.status : 400,
          message: error.message || 'Stripe could not create the refund.'
        }
      };
    }

    const newRefundedPence = refundedPence + amountPence;
    const fullyRefunded = newRefundedPence >= totalPence;
    const restoreInventory = fullyRefunded && !['Dispatched', 'Delivered'].includes(order.order_status);
    await client.query(
      `INSERT INTO order_refunds (order_id, idempotency_key, stripe_refund_id, amount)
       VALUES ($1,$2,$3,$4)`,
      [order.id, idempotencyKey, refund.id, amountPence / 100]
    );
    await client.query(
      `UPDATE orders SET refunded_amount=$2, payment_status=$3,
         order_status=CASE WHEN $3='Refunded' THEN 'Cancelled' ELSE order_status END
       WHERE id=$1`,
      [order.id, newRefundedPence / 100, fullyRefunded ? 'Refunded' : 'Paid']
    );
    if (restoreInventory) await restoreOrderReservation(client, order.id);
    return {
      refundId: refund.id,
      amount: amountPence / 100,
      fullyRefunded,
      duplicate: false
    };
  });
}
