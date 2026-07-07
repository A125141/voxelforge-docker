// World CRUD routes.
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import xss from 'xss';
import { World } from '../models/World.js';
import { ChunkService, CHUNK_SIZE, CHUNK_HEIGHT } from '../services/chunkService.js';
import { verifyJWT } from '../middleware/auth.js';

export const worldsRouter = Router();

worldsRouter.use(verifyJWT);

worldsRouter.get('/', (req, res) => {
  const worlds = World.listByUser(req.user.id);
  res.json({ worlds });
});

worldsRouter.post('/',
  [
    body('name').trim().isLength({ min: 1, max: 64 }).escape(),
    body('seed').optional().isInt({ min: 0, max: 2147483647 }),
    body('gamemode').optional().isIn(['creative', 'survival']),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const name = xss(req.body.name);
    const seed = req.body.seed ?? Math.floor(Math.random() * 2_000_000_000);
    const gamemode = req.body.gamemode || 'creative';
    const world = World.create({ userId: req.user.id, name, seed, gamemode });
    res.json({ world });
  }
);

worldsRouter.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const result = World.delete(id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'World not found' });
  await ChunkService.deleteWorld(id);
  res.json({ ok: true });
});

// Bulk fetch chunk data for initial join (radius around spawn).
worldsRouter.get('/:id/chunks', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const world = World.findById(id);
  if (!world || world.user_id !== req.user.id) {
    return res.status(404).json({ error: 'World not found' });
  }
  const radius = Math.min(parseInt(req.query.radius || '4', 10), 8);
  const cx = parseInt(req.query.cx || '0', 10);
  const cz = parseInt(req.query.cz || '0', 10);

  const chunks = [];
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dz = -radius; dz <= radius; dz++) {
      const data = await ChunkService.get(id, cx + dx, cz + dz, world.seed);
      chunks.push({ cx: cx + dx, cz: cz + dz, data: Buffer.from(data).toString('base64') });
    }
  }
  res.json({
    world,
    chunkSize: CHUNK_SIZE,
    chunkHeight: CHUNK_HEIGHT,
    chunks,
  });
});

worldsRouter.get('/:id/state', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const world = World.findById(id);
  if (!world || world.user_id !== req.user.id) {
    return res.status(404).json({ error: 'World not found' });
  }
  const state = World.loadPosition(req.user.id, id);
  res.json({ state, world });
});

worldsRouter.post('/:id/state', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const world = World.findById(id);
  if (!world || world.user_id !== req.user.id) {
    return res.status(404).json({ error: 'World not found' });
  }
  World.savePosition({
    worldId: id,
    userId: req.user.id,
    x: parseFloat(req.body.x) || 0,
    y: parseFloat(req.body.y) || 64,
    z: parseFloat(req.body.z) || 0,
    yaw: parseFloat(req.body.yaw) || 0,
    pitch: parseFloat(req.body.pitch) || 0,
  });
  res.json({ ok: true });
});
