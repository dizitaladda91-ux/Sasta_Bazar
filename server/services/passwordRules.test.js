import test from 'node:test';
import assert from 'node:assert/strict';
import { DUMMY_PASSWORD_HASH, verifyPassword } from './passwordRules.js';

test('compares against the precomputed cost-12 hash when no account exists', async () => {
  let comparedHash;
  const valid = await verifyPassword('submitted-password', null, async (_password, hash) => {
    comparedHash = hash;
    return true;
  });
  assert.equal(comparedHash, DUMMY_PASSWORD_HASH);
  assert.match(DUMMY_PASSWORD_HASH, /^\$2[aby]\$12\$/);
  assert.equal(valid, false);
});

test('returns the bcrypt result for an existing account hash', async () => {
  const valid = await verifyPassword('submitted-password', 'stored-hash', async (_password, hash) => hash === 'stored-hash');
  assert.equal(valid, true);
});
