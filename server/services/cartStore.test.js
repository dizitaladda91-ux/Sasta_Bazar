import test from 'node:test';
import assert from 'node:assert/strict';
import { createCartStore, getCartKey } from './cartStore.js';

test('getCartKey formats user and guest Redis Hash keys', () => {
  assert.equal(getCartKey({ userId: 42 }), 'cart:42');
  assert.equal(getCartKey({ guestId: 'abc-123' }), 'cart:guest:abc-123');
});

test('cartStore adds, updates, removes, and merges guest cart into user cart', async () => {
  const store = createCartStore();
  const guestKey = getCartKey({ guestId: 'g1' });
  const userKey = getCartKey({ userId: 7 });

  await store.addItem(guestKey, { itemKey: '101_M_', id: 101, title: 'Suit', price: 20, quantity: 1 });
  await store.addItem(guestKey, { itemKey: '101_M_', id: 101, title: 'Suit', price: 20, quantity: 2 });

  let guestItems = await store.getItems(guestKey);
  assert.equal(guestItems.length, 1);
  assert.equal(guestItems[0].quantity, 3);

  await store.setItemQuantity(guestKey, '101_M_', 2);
  guestItems = await store.getItems(guestKey);
  assert.equal(guestItems[0].quantity, 2);

  const merged = await store.mergeCarts(guestKey, userKey);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].quantity, 2);
  assert.equal((await store.getItems(guestKey)).length, 0);

  await store.removeItem(userKey, '101_M_');
  assert.equal((await store.getItems(userKey)).length, 0);
});
