import test from 'node:test';
import assert from 'node:assert/strict';
import { assertTopLevelStockAllowed, getIncomingVariants } from './productRules.js';

test('rejects top-level stock for products with multiple variants', () => {
  assert.throws(
    () => assertTopLevelStockAllowed(5, 2),
    (error) => error.status === 409 && /each variant/.test(error.message)
  );
});

test('allows top-level stock when a product has at most one variant', () => {
  assert.doesNotThrow(() => assertTopLevelStockAllowed(5, 1));
  assert.doesNotThrow(() => assertTopLevelStockAllowed(undefined, 4));
});

test('counts generated variants when validating top-level stock', () => {
  const variants = getIncomingVariants({ sizes: ['S', 'M'], colors: ['Black', 'Blue'] }, 10, null);
  assert.equal(variants.length, 4);
});
