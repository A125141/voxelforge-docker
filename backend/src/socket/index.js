// Socket.io: multiplayer block sync & player position broadcasts.
import { Server } from 'socket.io';
import { verifySocketJWT } from '../middleware/auth.js';
import { ChunkService } from '../services/chunkService.js';
import { logger } from '../utils/logger.js';

export function setupSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    maxHttpBufferSize: 5 * 1024 * 1024,
  });

  // Shared in-memory state for active worlds.
  const worldStates = new Map(); // worldId -> { players: Map<socketId, {user, x,y,z,yaw,pitch}> }

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    const payload = verifySocketJWT(token);
    if (!payload) return next(new Error('unauthorized'));
    socket.user = payload;
    next();
  });

  io.on('connection', (socket) => {
    logger.info(`[Socket] connected: ${socket.user.username} (${socket.id})`);

    socket.on('joinWorld', async ({ worldId, seed }) => {
      socket.join(`world:${worldId}`);
      socket.worldId = worldId;
      socket.seed = seed;
      if (!worldStates.has(worldId)) worldStates.set(worldId, { players: new Map() });
      const ws = worldStates.get(worldId);
      ws.players.set(socket.id, { user: socket.user, x: 0, y: 64, z: 0, yaw: 0, pitch: 0 });
      socket.to(`world:${worldId}`).emit('playerJoined', { id: socket.id, user: socket.user });
      socket.emit('currentPlayers', Array.from(ws.players.entries())
        .filter(([id]) => id !== socket.id)
        .map(([id, p]) => ({ id, ...p })));
    });

    socket.on('playerMove', ({ x, y, z, yaw, pitch }) => {
      const ws = worldStates.get(socket.worldId);
      if (!ws) return;
      const p = ws.players.get(socket.id);
      if (!p) return;
      p.x = x; p.y = y; p.z = z; p.yaw = yaw; p.pitch = pitch;
      socket.to(`world:${socket.worldId}`).emit('playerMoved', { id: socket.id, x, y, z, yaw, pitch });
    });

    socket.on('blockUpdate', async ({ cx, cz, lx, ly, lz, blockId }) => {
      // Update the chunk in storage and broadcast.
      try {
        const data = await ChunkService.get(socket.worldId, cx, cz, socket.seed);
        const idx = (ly * 16 + lz) * 16 + lx;
        if (idx >= 0 && idx < data.length) {
          data[idx] = blockId;
          await ChunkService.save(socket.worldId, cx, cz, data);
        }
      } catch (err) {
        logger.error(`[Socket] blockUpdate error: ${err.message}`);
      }
      socket.to(`world:${socket.worldId}`).emit('blockUpdated', { cx, cz, lx, ly, lz, blockId });
    });

    socket.on('disconnect', () => {
      const ws = worldStates.get(socket.worldId);
      if (ws) {
        ws.players.delete(socket.id);
        socket.to(`world:${socket.worldId}`).emit('playerLeft', { id: socket.id });
      }
      logger.info(`[Socket] disconnected: ${socket.user.username} (${socket.id})`);
    });
  });

  return io;
}
