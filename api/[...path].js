import app from '../server/index.js';

export default function handler(req, res) {
  // Dynamic Vercel function routes can receive the path with or without /api.
  if (!req.url.startsWith('/api/')) {
    req.url = `/api${req.url.startsWith('/') ? req.url : `/${req.url}`}`;
  }
  return app(req, res);
}
