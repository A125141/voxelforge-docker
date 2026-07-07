// JWT verification middleware.
import jwt from 'jsonwebtoken';
import config from '../config/index.js';

export function verifyJWT(req, res, next) {
  // Token may come from cookie or Authorization header.
  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function verifySocketJWT(token) {
  if (!token) return null;
  try { return jwt.verify(token, config.jwtSecret); }
  catch { return null; }
}
