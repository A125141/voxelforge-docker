// Small math helpers.
export function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function mod(n, m) { return ((n % m) + m) % m; }

// Raycast through voxel grid (Amanatides & Woo algorithm).
export function raycastVoxel(origin, dir, maxDist, sampleFn) {
  let x = Math.floor(origin.x);
  let y = Math.floor(origin.y);
  let z = Math.floor(origin.z);
  const stepX = Math.sign(dir.x);
  const stepY = Math.sign(dir.y);
  const stepZ = Math.sign(dir.z);
  const tDeltaX = dir.x !== 0 ? Math.abs(1 / dir.x) : Infinity;
  const tDeltaY = dir.y !== 0 ? Math.abs(1 / dir.y) : Infinity;
  const tDeltaZ = dir.z !== 0 ? Math.abs(1 / dir.z) : Infinity;
  let tMaxX = dir.x !== 0 ? (stepX > 0 ? (x + 1 - origin.x) : (origin.x - x)) * tDeltaX : Infinity;
  let tMaxY = dir.y !== 0 ? (stepY > 0 ? (y + 1 - origin.y) : (origin.y - y)) * tDeltaY : Infinity;
  let tMaxZ = dir.z !== 0 ? (stepZ > 0 ? (z + 1 - origin.z) : (origin.z - z)) * tDeltaZ : Infinity;

  let t = 0;
  let face = null;
  while (t < maxDist) {
    const block = sampleFn(x, y, z);
    if (block) return { x, y, z, face, t };
    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      x += stepX; t = tMaxX; tMaxX += tDeltaX; face = stepX > 0 ? 'west' : 'east';
    } else if (tMaxY < tMaxZ) {
      y += stepY; t = tMaxY; tMaxY += tDeltaY; face = stepY > 0 ? 'bottom' : 'top';
    } else {
      z += stepZ; t = tMaxZ; tMaxZ += tDeltaZ; face = stepZ > 0 ? 'north' : 'south';
    }
  }
  return null;
}
