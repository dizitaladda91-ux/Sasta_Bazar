import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
if (Boolean(upstashUrl) !== Boolean(upstashToken)) {
  throw new Error('Set both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable shared rate limiting.');
}

const redis = upstashUrl ? Redis.fromEnv() : null;

const makeLimiter = ({ name, windowMs, limit, message, keyGenerator }) => {
  if (redis) {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${Math.ceil(windowMs / 1000)} s`),
      prefix: `sasta-bazaar:${name}`
    });
    return (req, res, next) => {
      const key = keyGenerator ? keyGenerator(req) : ipKeyGenerator(req.ip);
      limiter.limit(key).then((result) => {
        const reset = Math.ceil(result.reset / 1000);
        res.set({
          'RateLimit-Limit': String(result.limit),
          'RateLimit-Remaining': String(result.remaining),
          'RateLimit-Reset': String(reset)
        });
        if (!result.success) {
          res.set('Retry-After', String(Math.max(1, reset - Math.floor(Date.now() / 1000))));
          return res.status(429).json({ success: false, message });
        }
        return next();
      }).catch(next);
    };
  }

  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    ...(keyGenerator ? { keyGenerator } : {}),
    handler: (_req, res) => res.status(429).json({ success: false, message })
  });
};

const minute = 60 * 1000;
const hour = 60 * minute;

const ipAndEmailKey = (req) => (
  `${ipKeyGenerator(req.ip)}|${String(req.body?.email || '').trim().toLowerCase()}`
);

export const generalLimiter = makeLimiter({
  name: 'general',
  windowMs: 15 * minute,
  limit: 300,
  message: 'Too many requests from this address. Please try again later.'
});

export const loginLimiter = makeLimiter({
  name: 'login',
  windowMs: 15 * minute,
  limit: 5,
  keyGenerator: ipAndEmailKey,
  message: 'Too many login attempts. Please try again later.'
});

export const registerLimiter = makeLimiter({
  name: 'register',
  windowMs: hour,
  limit: 5,
  message: 'Too many registration attempts. Please try again later.'
});

export const contactLimiter = makeLimiter({
  name: 'contact',
  windowMs: hour,
  limit: 5,
  message: 'Too many form submissions. Please try again later.'
});

export const customizationLimiter = makeLimiter({
  name: 'customization',
  windowMs: hour,
  limit: 5,
  message: 'Too many form submissions. Please try again later.'
});

export const newsletterLimiter = makeLimiter({
  name: 'newsletter',
  windowMs: hour,
  limit: 5,
  message: 'Too many form submissions. Please try again later.'
});

export const trackLimiter = makeLimiter({
  name: 'track',
  windowMs: 15 * minute,
  limit: 20,
  message: 'Too many tracking requests. Please try again later.'
});

export const checkoutLimiter = makeLimiter({
  name: 'checkout',
  windowMs: 15 * minute,
  limit: 20,
  message: 'Too many checkout requests. Please try again later.'
});
