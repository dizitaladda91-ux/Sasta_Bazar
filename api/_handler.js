import app from '../server/index.js';

export default function handler(req, res) {
  // Keep Express route matching consistent if Vercel strips the function prefix.
  if (!req.url.startsWith('/api/')) {
    req.url = `/api${req.url.startsWith('/') ? req.url : `/${req.url}`}`;
  }
  return app(req, res);
}
