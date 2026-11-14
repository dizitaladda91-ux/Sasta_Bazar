import { ipKeyGenerator, rateLimit } from 'express-rate-limit';

const makeLimiter = ({ windowMs, limit, message, keyGenerator }) => rateLimit({
  windowMs,
  limit,
  standardHeaders: true,
  legacyHeaders: false,
  ...(keyGenerator ? { keyGenerator } : {}),
  handler: (_req, res) => res.status(429).json({ success: false, message })
});

const minute = 60 * 1000;
const hour = 60 * minute;

const ipAndEmailKey = (req) => (
  `${ipKeyGenerator(req.ip)}|${String(req.body?.email || '').trim().toLowerCase()}`
);

export const generalLimiter = makeLimiter({
  windowMs: 15 * minute,
  limit: 300,
  message: 'Too many requests from this address. Please try again later.'
});

export const loginLimiter = makeLimiter({
  windowMs: 15 * minute,
  limit: 5,
  keyGenerator: ipAndEmailKey,
  message: 'Too many login attempts. Please try again later.'
});

export const registerLimiter = makeLimiter({
  windowMs: hour,
  limit: 5,
  message: 'Too many registration attempts. Please try again later.'
});

export const contactLimiter = makeLimiter({
  windowMs: hour,
  limit: 5,
  message: 'Too many form submissions. Please try again later.'
});

export const customizationLimiter = makeLimiter({
  windowMs: hour,
  limit: 5,
  message: 'Too many form submissions. Please try again later.'
});

export const newsletterLimiter = makeLimiter({
  windowMs: hour,
  limit: 5,
  message: 'Too many form submissions. Please try again later.'
});

export const trackLimiter = makeLimiter({
  windowMs: 15 * minute,
  limit: 20,
  message: 'Too many tracking requests. Please try again later.'
});

export const checkoutLimiter = makeLimiter({
  windowMs: 15 * minute,
  limit: 20,
  message: 'Too many checkout requests. Please try again later.'
});
