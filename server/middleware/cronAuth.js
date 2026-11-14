import crypto from 'node:crypto';

export function requireCronSecret(req, res, next) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 32) {
    return res.status(503).json({ success: false, message: 'Cron authorization is not configured.' });
  }

  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const expectedBuffer = Buffer.from(secret);
  const tokenBuffer = Buffer.from(token);
  if (tokenBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(tokenBuffer, expectedBuffer)) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }
  return next();
}
