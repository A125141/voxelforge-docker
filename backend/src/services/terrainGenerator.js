// Procedural terrain generator using simplex-noise 4.x API.
import { createNoise2D, createNoise3D } from 'simplex-noise';
import { Block } from './blockRegistry.js';

export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 256;

// Simple seedable PRNG (mulberry32) so seeds produce reproducible noise.
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeGenerator(seed) {
  const rng = mulberry32(seed);
  const noise2D = createNoise2D(rng);
  const noise3D = createNoise3D(rng);
  return { noise2D, noise3D };
}

// Biome determination from temperature & humidity noise.
function getBiome(tempN, humidN) {
  if (tempN > 0.4) return 'desert';
  if (humidN > 0.3 && tempN < -0.2) return 'forest';
  if (tempN < -0.4) return 'mountains';
  return 'plains';
}

function heightAt(noise2D, x, z, biome) {
  const base = noise2D(x * 0.005, z * 0.005) * 32;
  const hills = noise2D(x * 0.02, z * 0.02) * 8;
  let h = 64 + base + hills;
  if (biome === 'mountains') h += noise2D(x * 0.003, z * 0.003) * 48;
  if (biome === 'desert') h = Math.max(60, h - 4);
  return Math.max(1, Math.min(CHUNK_HEIGHT - 20, Math.floor(h)));
}

function oreAt(noise3D, x, y, z) {
  const coal = noise3D(x * 0.1, y * 0.1, z * 0.1);
  const iron = noise3D(x * 0.08 + 100, y * 0.08, z * 0.08);
  if (y < 16 && iron > 0.75) return Block.IRON_ORE;
  if (y < 48 && coal > 0.78) return Block.COAL_ORE;
  return null;
}

// Generate a single chunk's block data (16x256x16).
export function generateChunkData(cx, cz, seed) {
  const { noise2D, noise3D } = makeGenerator(seed);
  const data = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
  const idx = (x, y, z) => (y * CHUNK_SIZE + z) * CHUNK_SIZE + x;

  const trees = [];

  for (let lx = 0; lx < CHUNK_SIZE; lx++) {
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      const wx = cx * CHUNK_SIZE + lx;
      const wz = cz * CHUNK_SIZE + lz;
      const tempN = noise2D(wx * 0.01, wz * 0.01);
      const humidN = noise2D(wx * 0.01 + 500, wz * 0.01 + 500);
      const biome = getBiome(tempN, humidN);
      const h = heightAt(noise2D, wx, wz, biome);

      for (let y = 0; y < CHUNK_HEIGHT; y++) {
        let block = Block.AIR;
        if (y === 0) block = Block.BEDROCK;
        else if (y < h - 4) block = Block.STONE;
        else if (y < h) block = Block.DIRT;
        else if (y === h) {
          if (biome === 'desert') block = Block.SAND;
          else if (biome === 'mountains' && h > 90) block = Block.SNOW;
          else block = Block.GRASS;
        }

        if (block === Block.STONE) {
          const ore = oreAt(noise3D, wx, y, wz);
          if (ore) block = ore;
        }
        if (y > h && y <= 62 && block === Block.AIR) block = Block.WATER;

        data[idx(lx, y, lz)] = block;
      }

      // Surface decorations
      const top = h;
      if (top > 62 && (data[idx(lx, top, lz)] === Block.GRASS)) {
        const r = noise2D(wx * 0.5 + 1234, wz * 0.5 + 5678);
        if (r > 0.85 && biome !== 'desert') {
          trees.push({ x: lx, y: top + 1, z: lz, type: biome === 'forest' ? 'spruce' : 'oak' });
        }
        if (r < -0.9 && biome === 'plains') {
          data[idx(lx, top + 1, lz)] = (Math.random() < 0.5 ? Block.FLOWER_RED : Block.FLOWER_YELLOW);
        }
      }
    }
  }

  // Plant trees after terrain pass to avoid overwriting.
  for (const t of trees) {
    placeTree(data, t.x, t.y, t.z, t.type);
  }

  return data;
}

function placeTree(data, x, y, z, type) {
  const idx = (lx, ly, lz) => (ly * CHUNK_SIZE + lz) * CHUNK_SIZE + lx;
  const height = type === 'spruce' ? 7 : 5;
  // Trunk
  for (let i = 0; i < height; i++) {
    if (y + i < CHUNK_HEIGHT) data[idx(x, y + i, z)] = Block.LOG;
  }
  // Leaves
  const top = y + height - 1;
  for (let dy = -2; dy <= 1; dy++) {
    const r = type === 'spruce' ? Math.max(1, 3 - dy) : 2;
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (dx === 0 && dz === 0 && dy < 1) continue;
        const lx = x + dx, ly = top + dy, lz = z + dz;
        if (lx < 0 || lx >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE) continue;
        if (ly < 0 || ly >= CHUNK_HEIGHT) continue;
        if (data[idx(lx, ly, lz)] === Block.AIR) data[idx(lx, ly, lz)] = Block.LEAVES;
      }
    }
  }
}
