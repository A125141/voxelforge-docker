// App entry: orchestrates auth, world select, and the game loop.
import { api } from './network/api.js';
import { connectSocket, disconnectSocket } from './network/socket.js';
import { renderLoginScreen } from './ui/LoginScreen.js';
import { renderWorldSelect } from './ui/WorldSelect.js';
import { HUD } from './ui/HUD.js';
import { Inventory } from './ui/Inventory.js';
import { Renderer } from './renderer/Renderer.js';
import { World } from './game/World.js';
import { PlayerController } from './game/PlayerController.js';
import { CHUNK_SIZE } from './utils/constants.js';

async function bootstrap() {
  // Check existing session.
  let meRes;
  try { meRes = await api.me(); }
  catch { meRes = { user: null }; }

  if (meRes.user) {
    connectSocket(getTokenFromCookie());
    showWorldSelect();
  } else {
    renderLoginScreen(showWorldSelect);
  }
}

function getTokenFromCookie() {
  const m = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return m ? m[1] : '';
}

async function showWorldSelect() {
  const { worlds } = await api.listWorlds();
  renderWorldSelect(
    worlds,
    async (name, seed, gamemode) => {
      await api.createWorld(name, seed, gamemode);
      showWorldSelect();
    },
    async (id) => {
      await api.deleteWorld(id);
      showWorldSelect();
    },
    async (id) => { await enterWorld(id); }
  );
}

async function enterWorld(worldId) {
  // Fetch initial chunks around spawn (0,0).
  const { world, chunks, chunkSize, chunkHeight } = await api.getChunks(worldId, 0, 0, 6);

  // Set up renderer + world.
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
  document.getElementById('app').innerHTML = '';
  document.getElementById('app').appendChild(canvas);

  const renderer = new Renderer(canvas);
  const world3d = new World(renderer.scene, renderer.atlas);
  world3d.setWorld(world.id, world.seed);

  for (const c of chunks) {
    world3d.loadChunk(c.cx, c.cz, c.data);
  }

  // Try to restore player position.
  let startX = 0, startY = 80, startZ = 0;
  try {
    const { state } = await api.getState(worldId);
    if (state) { startX = state.x; startY = state.y; startZ = state.z; }
  } catch {}

  // Find a safe spawn Y if none cached.
  if (startY === 80) {
    for (let y = 100; y > 0; y--) {
      if (world3d.getBlock(Math.floor(startX), y, Math.floor(startZ)) !== 0) {
        startY = y + 1; break;
      }
    }
  }

  const player = new PlayerController(renderer.camera, world3d, canvas);
  player.position.set(startX, startY, startZ);
  player.gamemode = world.gamemode;

  const hud = new HUD();
  hud.setHotbar(player.hotbar);
  hud.setGamemode(world.gamemode);
  const inventory = new Inventory(player, () => {});

  // Track selected slot changes.
  let lastSlot = player.selectedSlot;
  let lastSave = 0;
  let lastMoveEmit = 0;

  const socket = window.__voxelforgeSocket;
  if (socket) {
    socket.emit('joinWorld', { worldId: world.id, seed: world.seed });
    socket.on('blockUpdated', ({ cx, cz, lx, ly, lz, blockId }) => {
      const wx = cx * CHUNK_SIZE + lx;
      const wz = cz * CHUNK_SIZE + lz;
      world3d.setBlock(wx, ly, wz, blockId);
    });
    socket.on('playerMoved', (data) => {
      // TODO: render other players.
    });
  }

  // Game loop.
  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    player.update(dt);
    world3d.updateMeshes(3);
    world3d.unloadDistant(player.position.x, player.position.z);

    // Stream new chunks if needed.
    const needed = world3d.getNeededChunks(player.position.x, player.position.z);
    if (needed.length > 0) {
      const next = needed[0];
      api.getChunks(worldId, next.cx, next.cz, 0).then(({ chunks }) => {
        for (const c of chunks) {
          if (!world3d.chunks.has(`${c.cx},${c.cz}`)) {
            world3d.loadChunk(c.cx, c.cz, c.data);
          }
        }
      }).catch(() => {});
    }

    if (player.selectedSlot !== lastSlot) {
      lastSlot = player.selectedSlot;
      hud.setSelectedSlot(lastSlot);
    }

    hud.setDebug(`XYZ: ${player.position.x.toFixed(1)} ${player.position.y.toFixed(1)} ${player.position.z.toFixed(1)} | Chunks: ${world3d.chunks.size}`);

    // Periodic state save (every 5s).
    if (now - lastSave > 5000) {
      lastSave = now;
      api.saveState(worldId, {
        x: player.position.x, y: player.position.y, z: player.position.z,
        yaw: player.yaw, pitch: player.pitch,
      }).catch(() => {});
    }
    // Periodic position broadcast (every 100ms).
    if (socket && now - lastMoveEmit > 100) {
      lastMoveEmit = now;
      socket.emit('playerMove', {
        x: player.position.x, y: player.position.y, z: player.position.z,
        yaw: player.yaw, pitch: player.pitch,
      });
    }

    renderer.render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Cleanup on page unload.
  window.addEventListener('beforeunload', () => {
    api.saveState(worldId, {
      x: player.position.x, y: player.position.y, z: player.position.z,
      yaw: player.yaw, pitch: player.pitch,
    }).catch(() => {});
  });
}

bootstrap();
