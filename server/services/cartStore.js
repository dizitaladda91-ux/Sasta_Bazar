import Redis from 'ioredis';

const CART_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

class MemoryHashBackend {
  constructor() {
    this.hashes = new Map();
  }

  _getValidHash(key) {
    const entry = this.hashes.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.hashes.delete(key);
      return null;
    }
    return entry;
  }

  async hset(key, field, value) {
    let entry = this._getValidHash(key);
    if (!entry) {
      entry = { map: new Map(), expiresAt: Date.now() + CART_TTL_SECONDS * 1000 };
      this.hashes.set(key, entry);
    }
    entry.map.set(field, value);
    return 1;
  }

  async hget(key, field) {
    return this._getValidHash(key)?.map.get(field) ?? null;
  }

  async hgetall(key) {
    const entry = this._getValidHash(key);
    if (!entry) return {};
    return Object.fromEntries(entry.map.entries());
  }

  async hdel(key, field) {
    const entry = this._getValidHash(key);
    if (!entry) return 0;
    return entry.map.delete(field) ? 1 : 0;
  }

  async del(key) {
    return this.hashes.delete(key) ? 1 : 0;
  }

  async expire(key, ttlSeconds) {
    const entry = this._getValidHash(key);
    if (entry) entry.expiresAt = Date.now() + ttlSeconds * 1000;
  }
}

class UpstashHashBackend {
  constructor(url, token) {
    this.url = url.replace(/\/+$/, '');
    this.token = token;
  }

  async cmd(parts) {
    const res = await fetch(this.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(parts),
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) throw new Error(`Upstash Redis HTTP ${res.status}`);
    const data = await res.json();
    return data.result;
  }

  hset(key, field, value) { return this.cmd(['HSET', key, field, value]); }
  hget(key, field) { return this.cmd(['HGET', key, field]); }

  async hgetall(key) {
    const raw = await this.cmd(['HGETALL', key]);
    if (!Array.isArray(raw)) return raw || {};
    const out = {};
    for (let i = 0; i < raw.length; i += 2) out[raw[i]] = raw[i + 1];
    return out;
  }

  hdel(key, field) { return this.cmd(['HDEL', key, field]); }
  del(key) { return this.cmd(['DEL', key]); }
  expire(key, ttlSeconds) { return this.cmd(['EXPIRE', key, String(ttlSeconds)]); }
}

class IoRedisHashBackend {
  constructor(redisUrl) {
    this.client = globalThis.__sastaBazaarRedis || new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      connectTimeout: 5000,
      lazyConnect: true
    });
    globalThis.__sastaBazaarRedis = this.client;
  }

  hset(key, field, value) { return this.client.hset(key, field, value); }
  hget(key, field) { return this.client.hget(key, field); }
  hgetall(key) { return this.client.hgetall(key); }
  hdel(key, field) { return this.client.hdel(key, field); }
  del(key) { return this.client.del(key); }
  expire(key, ttlSeconds) { return this.client.expire(key, ttlSeconds); }
}

function createBackend() {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return { kind: 'upstash', client: new UpstashHashBackend(process.env.UPSTASH_REDIS_REST_URL, process.env.UPSTASH_REDIS_REST_TOKEN) };
  }
  if (process.env.REDIS_URL) {
    return { kind: 'redis', client: new IoRedisHashBackend(process.env.REDIS_URL) };
  }
  return { kind: 'memory', client: globalThis.__sastaBazaarMemCart || new MemoryHashBackend() };
}

export function getCartKey({ userId = null, guestId = null }) {
  if (userId) return `cart:${userId}`;
  return `cart:guest:${guestId}`;
}

export function createCartStore(customBackend = null) {
  const { kind, client } = customBackend ? { kind: 'custom', client: customBackend } : createBackend();
  if (kind === 'memory') globalThis.__sastaBazaarMemCart = client;

  const parseField = (raw) => {
    if (!raw) return null;
    try {
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return null;
    }
  };

  return {
    backendKind: kind,
    ttlSeconds: CART_TTL_SECONDS,

    async getItems(cartKey) {
      const hash = await client.hgetall(cartKey);
      return Object.values(hash || {}).map(parseField).filter(Boolean);
    },

    async addItem(cartKey, item) {
      const field = String(item.itemKey || item.id);
      const existing = parseField(await client.hget(cartKey, field));
      const nextQty = Math.min(20, (existing?.quantity || 0) + Number(item.quantity || 1));
      const record = { ...existing, ...item, itemKey: field, quantity: nextQty };
      await client.hset(cartKey, field, JSON.stringify(record));
      await client.expire(cartKey, CART_TTL_SECONDS);
      return this.getItems(cartKey);
    },

    async setItemQuantity(cartKey, itemKey, quantity) {
      const field = String(itemKey);
      const qty = Number(quantity);
      if (qty <= 0) {
        await client.hdel(cartKey, field);
      } else {
        const existing = parseField(await client.hget(cartKey, field));
        if (existing) {
          existing.quantity = Math.min(20, qty);
          await client.hset(cartKey, field, JSON.stringify(existing));
          await client.expire(cartKey, CART_TTL_SECONDS);
        }
      }
      return this.getItems(cartKey);
    },

    async removeItem(cartKey, itemKey) {
      await client.hdel(cartKey, String(itemKey));
      return this.getItems(cartKey);
    },

    async clearCart(cartKey) {
      await client.del(cartKey);
      return [];
    },

    async mergeCarts(guestCartKey, userCartKey) {
      if (!guestCartKey || !userCartKey || guestCartKey === userCartKey) {
        return this.getItems(userCartKey);
      }
      const guestItems = await this.getItems(guestCartKey);
      for (const item of guestItems) {
        await this.addItem(userCartKey, item);
      }
      if (guestItems.length) {
        await client.del(guestCartKey);
      }
      return this.getItems(userCartKey);
    }
  };
}

export const cartStore = createCartStore();
