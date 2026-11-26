export class TtlCache {
  constructor(maxEntries = 300) {
    this.maxEntries = maxEntries;
    this.store = new Map();
    this.inflight = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    // Refresh LRU order
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key, value, ttlMs) {
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) this.store.delete(oldestKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  }

  async getOrSet(key, ttlMs, loader) {
    const cached = this.get(key);
    if (cached !== undefined) {
      return { value: cached, hit: true };
    }
    if (this.inflight.has(key)) {
      const value = await this.inflight.get(key);
      return { value, hit: true };
    }

    const promise = Promise.resolve()
      .then(loader)
      .then((value) => {
        if (value !== undefined && value !== null) {
          this.set(key, value, ttlMs);
        }
        return value;
      })
      .finally(() => {
        this.inflight.delete(key);
      });

    this.inflight.set(key, promise);
    const value = await promise;
    return { value, hit: false };
  }

  invalidatePrefix(prefix) {
    let removed = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        removed += 1;
      }
    }
    return removed;
  }

  clear() {
    this.store.clear();
  }

  size() {
    return this.store.size;
  }
}

export const TTL = {
  FIVE_MIN: 5 * 60 * 1000,
  TEN_MIN: 10 * 60 * 1000,
  FIFTEEN_MIN: 15 * 60 * 1000
};

export const appCache = globalThis.__sastaBazaarCache || new TtlCache(400);
globalThis.__sastaBazaarCache = appCache;
