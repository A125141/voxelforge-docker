// SQLite connection (synchronous via better-sqlite3). Singleton.
import Database from 'better-sqlite3';
import config from '../config/index.js';
import { runMigrations } from './migrations.js';
import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../utils/logger.js';

let dbInstance = null;

export function getDB() {
  if (dbInstance) return dbInstance;
  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
  dbInstance = new Database(config.dbPath);
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');
  dbInstance.pragma('synchronous = NORMAL');
  runMigrations(dbInstance);
  logger.info(`[DB] Opened at ${config.dbPath}`);
  return dbInstance;
}

export function closeDB() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    logger.info('[DB] Closed');
  }
}
