// Main entrypoint: Express + Socket.io + static serving.
import express from 'express';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import config from './config/index.js';
import { getDB, closeDB } from './database/db.js';
import { authRouter } from './routes/auth.js';
import { worldsRouter } from './routes/worlds.js';
import { setupSocket } from './socket/index.js';
import { ChunkService } from './services/chunkService.js';
import { logger } from './utils/logger.js';

// Ensure data directories exist.
fs.mkdirSync(config.dataPath, { recursive: true });
fs.mkdirSync(config.worldsPath, { recursive: true });
fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

// Initialize DB.
getDB();

const app = express();
const httpServer = http.createServer(app);

// Middleware.
app.use(helmet({
  contentSecurityPolicy: false, // game loads inline scripts via Vite
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());
app.use(morgan('combined', { stream: { write: m => logger.info(m.trim()) } }));

// Health check.
app.get('/api/v1/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// API routes.
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/worlds', worldsRouter);

// Serve built frontend.
app.use(express.static(config.publicDir, {
  maxAge: config.isProd ? '1y' : 0,
  index: 'index.html',
}));

// SPA fallback.
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(config.publicDir, 'index.html'));
});

// Error handler.
app.use((err, req, res, _next) => {
  logger.error(`[ERR] ${err.message}\n${err.stack}`);
  res.status(500).json({ error: 'Internal server error' });
});

// Socket.io.
const io = setupSocket(httpServer);

// Graceful shutdown.
let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`[Shutdown] received ${signal}, flushing chunks...`);
  await ChunkService.flushAll();
  io.close();
  httpServer.close();
  closeDB();
  logger.info('[Shutdown] complete');
  process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

httpServer.listen(config.port, () => {
  logger.info(`[VoxelForge] listening on :${config.port} (${config.env})`);
});
