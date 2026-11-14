import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCouponDiscount, hasCouponUsageAvailable } from './couponRules.js';

test('calculates stored percentage and fixed discounts without exceeding subtotal', () => {
  assert.equal(calculateCouponDiscount(80, {
    discount_type: 'percent', discount_value: '10', minimum_order: '0'
  }), 8);
  assert.equal(calculateCouponDiscount(8, {
    discount_type: 'fixed', discount_value: '12', minimum_order: '0'
  }), 8);
});

test('enforces minimum spend and redemption limits', () => {
  assert.throws(
    () => calculateCouponDiscount(20, { discount_type: 'percent', discount_value: 10, minimum_order: 25 }),
    (error) => error.status === 400
  );
  assert.equal(hasCouponUsageAvailable({ max_redemptions: 4, redemption_count: 2 }, 1), true);
  assert.equal(hasCouponUsageAvailable({ max_redemptions: 4, redemption_count: 2 }, 2), false);
  assert.equal(hasCouponUsageAvailable({ max_redemptions: null, redemption_count: 4 }, 10), true);
});
