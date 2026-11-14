import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set before starting the API server.');
}

const tokenOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/'
};

export function setAuthCookie(res, user) {
  const token = jwt.sign(
    { sub: String(user.id), role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  res.cookie('sb_token', token, { ...tokenOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

export function clearAuthCookie(res) {
  res.clearCookie('sb_token', tokenOptions);
}

export async function optionalAuth(req, _res, next) {
  const token = req.cookies?.sb_token;
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload || typeof payload !== 'object' || !payload.sub) {
      req.user = null;
      return next();
    }

    const result = await query(
      'SELECT id, public_id, name, email, phone, role FROM users WHERE id = $1',
      [payload.sub]
    );
    req.user = result.rows[0] || null;
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      req.user = null;
      return next();
    }
    return next(error);
  }
}

export function requireAuth(req, res, next) {
  optionalAuth(req, res, (error) => {
    if (error) return next(error);
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication is required.' });
    }
    return next();
  });
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, async (error) => {
    if (error) return next(error);
    if (res.headersSent) return;
    try {
      const result = await query('SELECT role FROM users WHERE id = $1', [req.user.id]);
      if (!result.rowCount || result.rows[0].role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Administrator access is required.' });
      }
      req.user.role = result.rows[0].role;
      return next();
    } catch (queryError) {
      return next(queryError);
    }
  });
}
