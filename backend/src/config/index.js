// Loads and validates environment variables, exports app-wide constants.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function required(name, fallback = null) {
  const v = process.env[name] ?? fallback;
  if (v === null || v === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: required('JWT_SECRET', 'dev_secret_change_me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  dataPath: path.resolve(process.env.DATA_PATH || './data'),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '600000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  logLevel: process.env.LOG_LEVEL || 'info',
  isProd: process.env.NODE_ENV === 'production',
  rootDir: path.resolve(__dirname, '..', '..'),
  publicDir: path.resolve(__dirname, '..', '..', 'public'),
  dbPath: '',
  worldsPath: '',
};

config.dbPath = path.join(config.dataPath, 'db', 'voxelforge.sqlite');
config.worldsPath = path.join(config.dataPath, 'worlds');

// Crash on default secret in production
if (config.isProd && (config.jwtSecret === 'dev_secret_change_me' ||
                      config.jwtSecret === 'change_this_please' ||
                      config.jwtSecret.includes('change'))) {
  console.error('[FATAL] JWT_SECRET must be set to a strong random value in production.');
  process.exit(1);
}

export default config;
