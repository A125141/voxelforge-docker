// Procedurally generates a 16x16 texture atlas via Canvas, returns THREE.Texture + UV map.
import * as THREE from 'three';
import { Block } from '../utils/constants.js';

const TILE = 16;
const COLS = 8;
const ROWS = 4;

// Coordinates (col, row) for each block's faces. Defaults to stone.
const FACE_TILES = {
  [Block.GRASS]:      { top: [0, 0], side: [1, 0], bottom: [2, 0] },
  [Block.DIRT]:       { top: [2, 0], side: [2, 0], bottom: [2, 0] },
  [Block.STONE]:      { top: [3, 0], side: [3, 0], bottom: [3, 0] },
  [Block.COBBLESTONE]:{ top: [4, 0], side: [4, 0], bottom: [4, 0] },
  [Block.PLANKS]:     { top: [5, 0], side: [5, 0], bottom: [5, 0] },
  [Block.LOG]:        { top: [6, 0], side: [7, 0], bottom: [6, 0] },
  [Block.LEAVES]:     { top: [0, 1], side: [0, 1], bottom: [0, 1] },
  [Block.SAND]:       { top: [1, 1], side: [1, 1], bottom: [1, 1] },
  [Block.WATER]:      { top: [2, 1], side: [2, 1], bottom: [2, 1] },
  [Block.BEDROCK]:    { top: [3, 1], side: [3, 1], bottom: [3, 1] },
  [Block.COAL_ORE]:   { top: [4, 1], side: [4, 1], bottom: [4, 1] },
  [Block.IRON_ORE]:   { top: [5, 1], side: [5, 1], bottom: [5, 1] },
  [Block.DEEPSLATE]:  { top: [6, 1], side: [6, 1], bottom: [6, 1] },
  [Block.SNOW]:       { top: [7, 1], side: [7, 1], bottom: [7, 1] },
  [Block.FLOWER_RED]: { top: [0, 2], side: [0, 2], bottom: [0, 2] },
  [Block.FLOWER_YELLOW]:{ top: [1, 2], side: [1, 2], bottom: [1, 2] },
  [Block.GLASS]:      { top: [2, 2], side: [2, 2], bottom: [2, 2] },
};

function noisePixel(ctx, x, y, base, variance) {
  const v = (Math.random() - 0.5) * variance;
  const r = Math.max(0, Math.min(255, base[0] + v));
  const g = Math.max(0, Math.min(255, base[1] + v));
  const b = Math.max(0, Math.min(255, base[2] + v));
  ctx.fillStyle = `rgb(${r|0},${g|0},${b|0})`;
  ctx.fillRect(x, y, 1, 1);
}

function drawTile(ctx, col, row, baseColor, variance = 20, pattern = 'noise') {
  const ox = col * TILE;
  const oy = row * TILE;
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      let v = variance;
      if (pattern === 'grass' && y < 3) v += 30; // brighter top edge
      noisePixel(ctx, ox + x, oy + y, baseColor, v);
    }
  }
}

export function buildTextureAtlas() {
  const canvas = document.createElement('canvas');
  canvas.width = COLS * TILE;
  canvas.height = ROWS * TILE;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const palette = {
    [Block.GRASS]:      [86, 145, 53],
    [Block.DIRT]:       [134, 96, 67],
    [Block.STONE]:      [128, 128, 128],
    [Block.COBBLESTONE]:[110, 110, 110],
    [Block.PLANKS]:     [160, 130, 80],
    [Block.LOG]:        [100, 70, 40],
    [Block.LEAVES]:     [60, 120, 40],
    [Block.SAND]:       [218, 200, 130],
    [Block.WATER]:      [40, 80, 180],
    [Block.BEDROCK]:    [60, 60, 60],
    [Block.COAL_ORE]:   [80, 80, 80],
    [Block.IRON_ORE]:   [120, 100, 90],
    [Block.DEEPSLATE]:  [55, 55, 70],
    [Block.SNOW]:       [240, 240, 245],
    [Block.FLOWER_RED]: [200, 40, 40],
    [Block.FLOWER_YELLOW]:[230, 200, 40],
    [Block.GLASS]:      [200, 230, 240],
  };

  for (const idStr in FACE_TILES) {
    const id = parseInt(idStr, 10);
    const tiles = FACE_TILES[id];
    for (const face of ['top', 'side', 'bottom']) {
      const [col, row] = tiles[face];
      drawTile(ctx, col, row, palette[id] || [180, 180, 180], 18, id === Block.GRASS && face === 'top' ? 'grass' : 'noise');
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;

  // UV lookup helper: returns [u0, v0, u1, v1] for a (blockId, face) pair.
  const uvMap = {};
  for (const idStr in FACE_TILES) {
    const id = parseInt(idStr, 10);
    uvMap[id] = {};
    for (const face of ['top', 'side', 'bottom']) {
      const [col, row] = FACE_TILES[id][face];
      const u0 = col / COLS;
      const v1 = 1 - row / ROWS;
      const u1 = (col + 1) / COLS;
      const v0 = 1 - (row + 1) / ROWS;
      uvMap[id][face] = [u0, v0, u1, v1];
    }
  }

  return { texture, uvMap };
}
