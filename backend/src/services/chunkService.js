// Persists chunk data as gzipped binary files. LRU cache in memory.
import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { promisify } from 'node:util';
import config from '../config/index.js';
import { generateChunkData, CHUNK_SIZE, CHUNK_HEIGHT } from './terrainGenerator.js';
import { logger } from '../utils/logger.js';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

const CACHE_SIZE = 50;
const cache = new Map(); // key -> Uint8Array

function chunkPath(worldId, cx, cz) {
  return path.join(config.worldsPath, String(worldId), 'chunks', `${cx}_${cz}.chunk`);
}

async function ensureWorldDir(worldId) {
  const dir = path.join(config.worldsPath, String(worldId), 'chunks');
  await fs.mkdir(dir, { recursive: true });
}

export const ChunkService = {
  async get(worldId, cx, cz, seed) {
    const key = `${worldId}:${cx}:${cz}`;
    if (cache.has(key)) {
      const v = cache.get(key);
      cache.delete(key); cache.set(key, v); // refresh LRU
      return v;
    }
    const file = chunkPath(worldId, cx, cz);
    try {
      const buf = await fs.readFile(file);
      const data = await gunzip(buf);
      const arr = new Uint8Array(data);
      this._cachePut(key, arr);
      return arr;
    } catch (err) {
      if (err.code !== 'ENOENT') logger.error(`[Chunk] read error ${file}: ${err.message}`);
      // Generate on the fly
      const arr = generateChunkData(cx, cz, seed);
      await this.save(worldId, cx, cz, arr);
      return arr;
    }
  },

  async save(worldId, cx, cz, data) {
    const key = `${worldId}:${cx}:${cz}`;
    await ensureWorldDir(worldId);
    const compressed = await gzip(Buffer.from(data));
    await fs.writeFile(chunkPath(worldId, cx, cz), compressed);
    this._cachePut(key, data);
  },

  async deleteWorld(worldId) {
    const dir = path.join(config.worldsPath, String(worldId));
    await fs.rm(dir, { recursive: true, force: true });
  },

  async flushAll() {
    // Cache is write-through; nothing to flush currently.
    logger.info(`[Chunk] Cache size=${cache.size}`);
  },

  _cachePut(key, val) {
    if (cache.size >= CACHE_SIZE) {
      const oldest = cache.keys().next().value;
      cache.delete(oldest);
    }
    cache.set(key, val);
  },
};

export { CHUNK_SIZE, CHUNK_HEIGHT };
