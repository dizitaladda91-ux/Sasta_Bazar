import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionStore } from './sessionStore.js';

test('sessionStore creates, reads, counts, and revokes sessions', async () => {
  const store = createSessionStore();
  await store.createSession({ jti: 'jti-1', userId: 42, role: 'customer', email: 'a@test.com', ttlSeconds: 60 });
  await store.createSession({ jti: 'jti-2', userId: 42, role: 'customer', email: 'a@test.com', ttlSeconds: 60 });

  const sess1 = await store.getSession('jti-1');
  assert.equal(sess1.userId, '42');
  assert.equal(await store.countUserSessions(42), 2);

  await store.revokeSession('jti-1', 42);
  assert.equal(await store.getSession('jti-1'), null);
  assert.equal(await store.countUserSessions(42), 1);

  const revokedCount = await store.revokeAllUserSessions(42);
  assert.equal(revokedCount, 1);
  assert.equal(await store.getSession('jti-2'), null);
  assert.equal(await store.countUserSessions(42), 0);
});
