// Rate limiting for auth endpoints.
import rateLimit from 'express-rate-limit';
import config from '../config/index.js';

export const authLimiter = rateLimit({
  windowMs: config.rateLimitWindow,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
