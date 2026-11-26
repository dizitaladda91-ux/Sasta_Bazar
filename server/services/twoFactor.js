import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateTotpSecret(byteLength = 20) {
  const bytes = crypto.randomBytes(byteLength);
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export function decodeBase32(secret) {
  const clean = String(secret || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function generateTotpCode(secret, timeMs = Date.now(), stepSeconds = 30) {
  const key = decodeBase32(secret);
  const counter = Math.floor(timeMs / 1000 / stepSeconds);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter), 0);

  const hmac = crypto.createHmac('sha1', key).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const codeInt =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(codeInt % 1_000_000).padStart(6, '0');
}

export function verifyTotpCode(secret, token, windowSteps = 1, timeMs = Date.now()) {
  const cleanToken = String(token || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleanToken) || !secret) return false;

  const stepMs = 30_000;
  for (let offset = -windowSteps; offset <= windowSteps; offset += 1) {
    const expected = generateTotpCode(secret, timeMs + offset * stepMs);
    if (
      expected.length === cleanToken.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(cleanToken))
    ) {
      return true;
    }
  }
  return false;
}

export function buildOtpAuthUri({ email, secret, issuer = 'SASTA BAZAAR' }) {
  const label = encodeURIComponent(`${issuer}:${email}`);
  return `otpauth://totp/${label}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

export async function generateBackupCodes(count = 6) {
  const plainCodes = [];
  const hashes = [];
  for (let i = 0; i < count; i += 1) {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
    const formatted = `${raw.slice(0, 4)}-${raw.slice(4)}`;
    plainCodes.push(formatted);
    hashes.push(await bcrypt.hash(raw, 10));
  }
  return { plainCodes, hashes };
}

export async function consumeBackupCode(code, hashes = []) {
  const normalized = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!normalized || !Array.isArray(hashes) || hashes.length === 0) {
    return { matched: false, remainingHashes: hashes || [] };
  }
  for (let i = 0; i < hashes.length; i += 1) {
    if (await bcrypt.compare(normalized, hashes[i])) {
      return {
        matched: true,
        remainingHashes: hashes.filter((_, idx) => idx !== i)
      };
    }
  }
  return { matched: false, remainingHashes: hashes };
}
