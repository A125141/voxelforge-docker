// Player physics, input handling, collision against voxel grid.
import * as THREE from 'three';
import { GRAVITY, JUMP_VELOCITY, WALK_SPEED, SPRINT_SPEED, SNEAK_SPEED, FLY_SPEED,
         PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_EYE, REACH_DISTANCE, Block } from '../utils/constants.js';
import { isSolid } from './BlockRegistry.js';
import { raycastVoxel } from '../utils/math.js';

export class PlayerController {
  constructor(camera, world, domElement) {
    this.camera = camera;
    this.world = world;
    this.dom = domElement;

    this.position = new THREE.Vector3(0, 70, 0);
    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.onGround = false;
    this.flying = false;
    this.sneaking = false;
    this.sprinting = false;
    this.gamemode = 'creative';

    this.hotbar = [Block.GRASS, Block.DIRT, Block.STONE, Block.COBBLESTONE,
                   Block.PLANKS, Block.LOG, Block.LEAVES, Block.SAND, Block.GLASS];
    this.selectedSlot = 0;

    this.keys = {};
    this.lastSpacePress = 0;
    this._bindInput();
  }

  _bindInput() {
    document.addEventListener('keydown', e => {
      if (e.repeat) return;
      this.keys[e.code] = true;
      if (e.code === 'Space') {
        const now = performance.now();
        if (now - this.lastSpacePress < 300 && this.gamemode === 'creative') {
          this.flying = !this.flying;
          this.velocity.y = 0;
        }
        this.lastSpacePress = now;
      }
      if (e.code === 'ShiftLeft') this.sneaking = true;
      if (e.code === 'ControlLeft') this.sprinting = true;
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= 9) this.selectedSlot = num - 1;
    });
    document.addEventListener('keyup', e => {
      this.keys[e.code] = false;
      if (e.code === 'ShiftLeft') this.sneaking = false;
      if (e.code === 'ControlLeft') this.sprinting = false;
    });

    // Pointer lock for mouse look.
    this.dom.addEventListener('click', () => {
      if (!document.pointerLockElement) this.dom.requestPointerLock();
    });
    document.addEventListener('mousemove', e => {
      if (document.pointerLockElement !== this.dom) return;
      this.yaw -= e.movementX * 0.0025;
      this.pitch -= e.movementY * 0.0025;
      this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
    });

    // Mouse buttons.
    document.addEventListener('mousedown', e => {
      if (document.pointerLockElement !== this.dom) return;
      if (e.button === 0) this.breakBlock();
      if (e.button === 2) this.placeBlock();
    });
    document.addEventListener('contextmenu', e => e.preventDefault());

    // Scroll wheel changes hotbar.
    document.addEventListener('wheel', e => {
      if (document.pointerLockElement !== this.dom) return;
      const dir = Math.sign(e.deltaY);
      this.selectedSlot = (this.selectedSlot + dir + 9) % 9;
    });
  }

  update(dt) {
    // Movement input.
    const forward = (this.keys['KeyW'] ? 1 : 0) - (this.keys['KeyS'] ? 1 : 0);
    const strafe = (this.keys['KeyD'] ? 1 : 0) - (this.keys['KeyA'] ? 1 : 0);
    const up = this.keys['Space'] ? 1 : 0;
    const down = this.keys['ShiftLeft'] && this.flying ? 1 : 0;

    let speed = WALK_SPEED;
    if (this.flying) speed = FLY_SPEED;
    else if (this.sneaking) speed = SNEAK_SPEED;
    else if (this.sprinting) speed = SPRINT_SPEED;

    const sinY = Math.sin(this.yaw), cosY = Math.cos(this.yaw);
    const moveX = (strafe * cosY - forward * sinY);
    const moveZ = (strafe * sinY + forward * cosY);
    const len = Math.hypot(moveX, moveZ) || 1;
    this.velocity.x = (moveX / len) * speed * (forward || strafe ? 1 : 0);
    this.velocity.z = (moveZ / len) * speed * (forward || strafe ? 1 : 0);

    if (this.flying) {
      this.velocity.y = (up - down) * FLY_SPEED;
    } else {
      this.velocity.y -= GRAVITY * dt;
      if (this.keys['Space'] && this.onGround) {
        this.velocity.y = JUMP_VELOCITY;
        this.onGround = false;
      }
    }

    this._moveWithCollision(dt);

    // Update camera.
    this.camera.position.set(
      this.position.x,
      this.position.y + PLAYER_EYE,
      this.position.z
    );
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  // AABB swept collision against voxel grid (simplified: per-axis resolution).
  _moveWithCollision(dt) {
    const half = PLAYER_WIDTH / 2;
    const height = PLAYER_HEIGHT;

    // X axis
    let newX = this.position.x + this.velocity.x * dt;
    if (this._collidesAt(newX, this.position.y, this.position.z, half, height)) {
      this.velocity.x = 0;
    } else { this.position.x = newX; }

    // Z axis
    let newZ = this.position.z + this.velocity.z * dt;
    if (this._collidesAt(this.position.x, this.position.y, newZ, half, height)) {
      this.velocity.z = 0;
    } else { this.position.z = newZ; }

    // Y axis
    let newY = this.position.y + this.velocity.y * dt;
    if (this._collidesAt(this.position.x, newY, this.position.z, half, height)) {
      if (this.velocity.y < 0) this.onGround = true;
      this.velocity.y = 0;
    } else {
      this.position.y = newY;
      this.onGround = false;
    }
  }

  _collidesAt(x, y, z, half, height) {
    const minX = Math.floor(x - half);
    const maxX = Math.floor(x + half);
    const minY = Math.floor(y);
    const maxY = Math.floor(y + height);
    const minZ = Math.floor(z - half);
    const maxZ = Math.floor(z + half);
    for (let bx = minX; bx <= maxX; bx++) {
      for (let by = minY; by <= maxY; by++) {
        for (let bz = minZ; bz <= maxZ; bz++) {
          if (isSolid(this.world.getBlock(bx, by, bz))) return true;
        }
      }
    }
    return false;
  }

  breakBlock() {
    const hit = this._raycast();
    if (!hit) return;
    if (this.gamemode !== 'creative' && hit.block === Block.BEDROCK) return;
    this.world.setBlock(hit.x, hit.y, hit.z, Block.AIR);
    this._emitBlockUpdate(hit.x, hit.y, hit.z, Block.AIR);
  }

  placeBlock() {
    const hit = this._raycast();
    if (!hit) return;
    const offsets = { top:[0,1,0], bottom:[0,-1,0], north:[0,0,1], south:[0,0,-1], east:[1,0,0], west:[-1,0,0] };
    const off = offsets[hit.face] || [0, 0, 0];
    const px = hit.x + off[0], py = hit.y + off[1], pz = hit.z + off[2];
    // Don't place inside the player.
    const half = PLAYER_WIDTH / 2;
    if (px === Math.floor(this.position.x) && pz === Math.floor(this.position.z) &&
        py >= Math.floor(this.position.y) && py <= Math.floor(this.position.y + PLAYER_HEIGHT)) return;
    const blockId = this.hotbar[this.selectedSlot];
    if (!blockId) return;
    this.world.setBlock(px, py, pz, blockId);
    this._emitBlockUpdate(px, py, pz, blockId);
  }

  _raycast() {
    const origin = { x: this.position.x, y: this.position.y + PLAYER_EYE, z: this.position.z };
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const hit = raycastVoxel(origin, dir, REACH_DISTANCE, (x, y, z) => {
      const b = this.world.getBlock(x, y, z);
      return b !== Block.AIR && b !== Block.WATER ? b : null;
    });
    if (!hit) return null;
    return { x: hit.x, y: hit.y, z: hit.z, face: hit.face, block: this.world.getBlock(hit.x, hit.y, hit.z) };
  }

  _emitBlockUpdate(wx, wy, wz, blockId) {
    if (!window.__voxelforgeSocket) return;
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    window.__voxelforgeSocket.emit('blockUpdate', { cx, cz, lx, ly: wy, lz, blockId });
  }
}
