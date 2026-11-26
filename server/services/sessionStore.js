import Redis from 'ioredis';

const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60;
const SESSION_PREFIX = 'sb:sess:';
const USER_SESSIONS_PREFIX = 'sb:user_sess:';

class MemorySessionBackend {
  constructor() {
    this.sessions = new Map();
    this.userIndex = new Map();
  }

  async set(key, value, ttlSeconds) {
    this.sessions.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async get(key) {
    const entry = this.sessions.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.sessions.delete(key);
      return null;
    }
    return entry.value;
  }

  async del(...keys) {
    for (const key of keys) this.sessions.delete(key);
  }

  async sadd(setKey, member) {
    if (!this.userIndex.has(setKey)) this.userIndex.set(setKey, new Set());
    this.userIndex.get(setKey).add(member);
  }

  async srem(setKey, member) {
    this.userIndex.get(setKey)?.delete(member);
  }

  async smembers(setKey) {
    return [...(this.userIndex.get(setKey) || [])];
  }

  async expire() {}
}

class UpstashRestBackend {
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

  set(key, value, ttlSeconds) {
    return this.cmd(['SET', key, value, 'EX', String(ttlSeconds)]);
  }

  get(key) {
    return this.cmd(['GET', key]);
  }

  del(...keys) {
    return keys.length ? this.cmd(['DEL', ...keys]) : 0;
  }

  sadd(setKey, member) {
    return this.cmd(['SADD', setKey, member]);
  }

  srem(setKey, member) {
    return this.cmd(['SREM', setKey, member]);
  }

  async smembers(setKey) {
    return (await this.cmd(['SMEMBERS', setKey])) || [];
  }

  expire(setKey, ttlSeconds) {
    return this.cmd(['EXPIRE', setKey, String(ttlSeconds)]);
  }
}

class IoRedisBackend {
  constructor(redisUrl) {
    this.client = globalThis.__sastaBazaarRedis || new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      connectTimeout: 5000,
      lazyConnect: true
    });
    globalThis.__sastaBazaarRedis = this.client;
  }

  set(key, value, ttlSeconds) {
    return this.client.set(key, value, 'EX', ttlSeconds);
  }

  get(key) {
    return this.client.get(key);
  }

  del(...keys) {
    return keys.length ? this.client.del(...keys) : 0;
  }

  sadd(setKey, member) {
    return this.client.sadd(setKey, member);
  }

  srem(setKey, member) {
    return this.client.srem(setKey, member);
  }

  smembers(setKey) {
    return this.client.smembers(setKey);
  }

  expire(setKey, ttlSeconds) {
    return this.client.expire(setKey, ttlSeconds);
  }
}

function createBackend() {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return { kind: 'upstash', client: new UpstashRestBackend(process.env.UPSTASH_REDIS_REST_URL, process.env.UPSTASH_REDIS_REST_TOKEN) };
  }
  if (process.env.REDIS_URL) {
    return { kind: 'redis', client: new IoRedisBackend(process.env.REDIS_URL) };
  }
  return { kind: 'memory', client: globalThis.__sastaBazaarMemSessions || new MemorySessionBackend() };
}

export function createSessionStore(customBackend = null) {
  const { kind, client } = customBackend ? { kind: 'custom', client: customBackend } : createBackend();
  if (kind === 'memory') globalThis.__sastaBazaarMemSessions = client;

  return {
    backendKind: kind,

    async createSession({ jti, userId, role, email, ttlSeconds = DEFAULT_TTL_SECONDS }) {
      const payload = JSON.stringify({
        jti,
        userId: String(userId),
        role,
        email,
        createdAt: new Date().toISOString()
      });
      const sessKey = `${SESSION_PREFIX}${jti}`;
      const userSetKey = `${USER_SESSIONS_PREFIX}${userId}`;
      await client.set(sessKey, payload, ttlSeconds);
      await client.sadd(userSetKey, jti);
      await client.expire(userSetKey, ttlSeconds);
    },

    async getSession(jti) {
      if (!jti) return null;
      const raw = await client.get(`${SESSION_PREFIX}${jti}`);
      if (!raw) return null;
      try {
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch {
        return null;
      }
    },

    async revokeSession(jti, userId = null) {
      if (!jti) return;
      const existing = userId ? { userId } : await this.getSession(jti);
      await client.del(`${SESSION_PREFIX}${jti}`);
      if (existing?.userId) {
        await client.srem(`${USER_SESSIONS_PREFIX}${existing.userId}`, jti);
      }
    },

    async revokeAllUserSessions(userId) {
      const userSetKey = `${USER_SESSIONS_PREFIX}${userId}`;
      const jtis = await client.smembers(userSetKey);
      if (jtis.length) {
        await client.del(...jtis.map((id) => `${SESSION_PREFIX}${id}`));
      }
      await client.del(userSetKey);
      return jtis.length;
    },

    async countUserSessions(userId) {
      const userSetKey = `${USER_SESSIONS_PREFIX}${userId}`;
      const jtis = await client.smembers(userSetKey);
      let active = 0;
      for (const jti of jtis) {
        if (await this.getSession(jti)) active += 1;
        else await client.srem(userSetKey, jti);
      }
      return active;
    }
  };
}

export const sessionStore = createSessionStore();
