// Manages the chunk grid, loading/unloading around the player.
import * as THREE from 'three';
import { Chunk } from './Chunk.js';
import { CHUNK_SIZE, CHUNK_HEIGHT, RENDER_DISTANCE, Block } from '../utils/constants.js';
import { isSolid } from './BlockRegistry.js';

export class World {
  constructor(scene, textureAtlas) {
    this.scene = scene;
    this.uvMap = textureAtlas.uvMap;
    this.chunks = new Map(); // "cx,cz" -> Chunk
    this.generationQueue = [];
    this.worldId = null;
    this.seed = 0;
  }

  setWorld(worldId, seed) {
    this.worldId = worldId;
    this.seed = seed;
  }

  key(cx, cz) { return `${cx},${cz}`; }

  // Returns block ID at world coords.
  getBlock(wx, wy, wz) {
    if (wy < 0 || wy >= CHUNK_HEIGHT) return Block.AIR;
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const chunk = this.chunks.get(this.key(cx, cz));
    if (!chunk) return Block.AIR;
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return chunk.get(lx, wy, lz);
  }

  setBlock(wx, wy, wz, id) {
    if (wy < 0 || wy >= CHUNK_HEIGHT) return;
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const chunk = this.chunks.get(this.key(cx, cz));
    if (!chunk) return;
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    chunk.set(lx, wy, lz, id);
    // Mark neighbor chunks dirty if on border.
    if (lx === 0) this._markDirty(cx - 1, cz);
    if (lx === CHUNK_SIZE - 1) this._markDirty(cx + 1, cz);
    if (lz === 0) this._markDirty(cx, cz - 1);
    if (lz === CHUNK_SIZE - 1) this._markDirty(cx, cz + 1);
  }

  _markDirty(cx, cz) {
    const c = this.chunks.get(this.key(cx, cz));
    if (c) c.dirty = true;
  }

  // Load a chunk from server data (data is base64 string).
  loadChunk(cx, cz, base64Data) {
    const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const chunk = new Chunk(cx, cz, bytes);
    this.chunks.set(this.key(cx, cz), chunk);
    this.scene.add(chunk.group);
    chunk.dirty = true;
  }

  // Build dirty chunk geometries (call once per frame, limited budget).
  updateMeshes(maxPerFrame = 2) {
    let count = 0;
    for (const chunk of this.chunks.values()) {
      if (chunk.dirty && count < maxPerFrame) {
        chunk.buildGeometry(this.uvMap, (wx, wy, wz) => this.getBlock(wx, wy, wz));
        count++;
      }
    }
  }

  // Unload chunks beyond the render distance from the player.
  unloadDistant(playerX, playerZ) {
    const pcx = Math.floor(playerX / CHUNK_SIZE);
    const pcz = Math.floor(playerZ / CHUNK_SIZE);
    for (const [key, chunk] of this.chunks) {
      const dx = chunk.cx - pcx;
      const dz = chunk.cz - pcz;
      if (Math.abs(dx) > RENDER_DISTANCE + 1 || Math.abs(dz) > RENDER_DISTANCE + 1) {
        this.scene.remove(chunk.group);
        chunk.dispose();
        this.chunks.delete(key);
      }
    }
  }

  // Returns list of chunk coords to load given player position.
  getNeededChunks(playerX, playerZ) {
    const pcx = Math.floor(playerX / CHUNK_SIZE);
    const pcz = Math.floor(playerZ / CHUNK_SIZE);
    const needed = [];
    for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
      for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
        const cx = pcx + dx;
        const cz = pcz + dz;
        if (!this.chunks.has(this.key(cx, cz))) {
          needed.push({ cx, cz, dist: dx * dx + dz * dz });
        }
      }
    }
    needed.sort((a, b) => a.dist - b.dist);
    return needed;
  }
}
