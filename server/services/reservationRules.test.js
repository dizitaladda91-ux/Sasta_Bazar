import test from 'node:test';
import assert from 'node:assert/strict';
import { getReservationLockKeys, hasReservationCapacity } from './reservationRules.js';

test('creates stable, sorted locks for checkout email and IP', () => {
  assert.deepEqual(
    getReservationLockKeys('BUYER@example.com', '192.0.2.1'),
    ['checkout-email:buyer@example.com', 'checkout-ip:192.0.2.1']
  );
});

test('allows at most three existing unpaid reservations per email and IP', () => {
  assert.equal(hasReservationCapacity(2, 0), true);
  assert.equal(hasReservationCapacity(3, 0), false);
  assert.equal(hasReservationCapacity(0, 3), false);
});
