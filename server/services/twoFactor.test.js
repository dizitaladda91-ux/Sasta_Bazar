import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildOtpAuthUri,
  consumeBackupCode,
  generateBackupCodes,
  generateTotpCode,
  generateTotpSecret,
  verifyTotpCode
} from './twoFactor.js';

test('generates valid Base32 secret and verifies TOTP within window', () => {
  const secret = generateTotpSecret();
  assert.match(secret, /^[A-Z2-7]{32}$/);
  const now = 1_700_000_000_000;
  const code = generateTotpCode(secret, now);
  assert.match(code, /^\d{6}$/);
  assert.equal(verifyTotpCode(secret, code, 1, now), true);
  assert.equal(verifyTotpCode(secret, code, 1, now + 30_000), true);
  assert.equal(verifyTotpCode(secret, '000000', 0, now), code === '000000');
});

test('builds standard otpauth URI for Authenticator apps', () => {
  const uri = buildOtpAuthUri({ email: 'user@example.com', secret: 'JBSWY3DPEHPK3PXP' });
  assert.ok(uri.startsWith('otpauth://totp/'));
  assert.ok(uri.includes('secret=JBSWY3DPEHPK3PXP'));
  assert.ok(uri.includes('issuer=SASTA%20BAZAAR'));
});

test('generates and consumes single-use backup codes', async () => {
  const { plainCodes, hashes } = await generateBackupCodes(4);
  assert.equal(plainCodes.length, 4);
  assert.equal(hashes.length, 4);

  const first = await consumeBackupCode(plainCodes[0], hashes);
  assert.equal(first.matched, true);
  assert.equal(first.remainingHashes.length, 3);

  const replay = await consumeBackupCode(plainCodes[0], first.remainingHashes);
  assert.equal(replay.matched, false);
});
