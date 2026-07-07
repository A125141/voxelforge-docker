// Authentication routes: register, login, guest, logout, me.
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import xss from 'xss';
import { User } from '../models/User.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import config from '../config/index.js';

export const authRouter = Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, isGuest: !!user.is_guest },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

function setCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

authRouter.post('/register',
  authLimiter,
  [
    body('username').trim().isLength({ min: 3, max: 24 }).escape(),
    body('password').isLength({ min: 6, max: 128 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const username = xss(req.body.username);
    if (User.findByUsername(username)) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    const user = User.create({ username, password: req.body.password, isGuest: false });
    const token = signToken(user);
    setCookie(res, token);
    res.json({ id: user.id, username });
  }
);

authRouter.post('/login',
  authLimiter,
  [
    body('username').trim().escape(),
    body('password').exists(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const username = xss(req.body.username);
    const user = User.findByUsername(username);
    if (!user || !User.verifyPassword(user, req.body.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signToken(user);
    setCookie(res, token);
    res.json({ id: user.id, username });
  }
);

authRouter.post('/guest', authLimiter, (req, res) => {
  const username = User.generateGuestName();
  const user = User.create({ username, isGuest: true });
  const token = signToken(user);
  setCookie(res, token);
  res.json({ id: user.id, username, guest: true });
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

authRouter.get('/me', (req, res) => {
  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7) : null);
  if (!token) return res.json({ user: null });
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    res.json({ user: payload });
  } catch {
    res.json({ user: null });
  }
});
