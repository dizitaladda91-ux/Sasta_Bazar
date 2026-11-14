import test from 'node:test';
import assert from 'node:assert/strict';
import { assertOrderStatusTransition } from './orderStatusRules.js';

test('allows only valid paid order status transitions', () => {
  assert.doesNotThrow(() => assertOrderStatusTransition('Awaiting Payment', 'Processing', 'Paid'));
  assert.doesNotThrow(() => assertOrderStatusTransition('Processing', 'Shipped', 'Paid'));
  assert.doesNotThrow(() => assertOrderStatusTransition('Dispatched', 'Delivered', 'Paid'));
});

test('rejects shipping unpaid orders and reopening cancelled orders', () => {
  assert.throws(
    () => assertOrderStatusTransition('Processing', 'Shipped', 'Pending'),
    (error) => error.status === 409
  );
  assert.throws(
    () => assertOrderStatusTransition('Cancelled', 'Processing', 'Paid'),
    (error) => error.status === 409 && /cannot be reopened/.test(error.message)
  );
});
