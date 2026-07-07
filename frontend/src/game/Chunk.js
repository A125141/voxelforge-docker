// Chunk: holds block data + builds greedy-meshed BufferGeometry.
import * as THREE from 'three';
import { CHUNK_SIZE, CHUNK_HEIGHT, Block } from '../utils/constants.js';
import { isTransparent, isSolid } from './BlockRegistry.js';

const FACES = [
  { dir: [ 1, 0, 0], corners: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]], face: 'side', normal: [ 1,0,0] },
  { dir: [-1, 0, 0], corners: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]], face: 'side', normal: [-1,0,0] },
  { dir: [ 0, 1, 0], corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]], face: 'top',   normal: [0, 1,0] },
  { dir: [ 0,-1, 0], corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]], face: 'bottom',normal: [0,-1,0] },
  { dir: [ 0, 0, 1], corners: [[1,0,1],[1,1,1],[0,1,1],[0,0,1]], face: 'side', normal: [0,0, 1] },
  { dir: [ 0, 0,-1], corners: [[0,0,0],[0,1,0],[1,1,0],[1,0,0]], face: 'side', normal: [0,0,-1] },
];

export class Chunk {
  constructor(cx, cz, data) {
    this.cx = cx;
    this.cz = cz;
    this.data = data; // Uint8Array (16*256*16)
    this.group = new THREE.Group();
    this.group.position.set(cx * CHUNK_SIZE, 0, cz * CHUNK_SIZE);
    this.dirty = true;
  }

  static idx(x, y, z) { return (y * CHUNK_SIZE + z) * CHUNK_SIZE + x; }

  get(x, y, z) {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) return Block.AIR;
    return this.data[Chunk.idx(x, y, z)];
  }

  set(x, y, z, v) {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) return;
    this.data[Chunk.idx(x, y, z)] = v;
    this.dirty = true;
  }

  // Build geometry via greedy meshing (axis-aligned face merging).
  // `neighborSample(x,y,z)` returns block IDs from neighboring chunks (world coords).
  buildGeometry(uvMap, neighborSample) {
    this.group.clear();
    const dims = [CHUNK_SIZE, CHUNK_HEIGHT, CHUNK_SIZE];

    // We build two meshes: opaque + transparent.
    const buffers = {
      opaque:  { pos: [], norm: [], uv: [], col: [], idx: [] },
      transparent: { pos: [], norm: [], uv: [], col: [], idx: [] },
    };

    for (let d = 0; d < 3; d++) {
      const u = (d + 1) % 3;
      const v = (d + 2) % 3;
      const x = [0, 0, 0];
      const q = [0, 0, 0];
      const mask = new Uint32Array(dims[u] * dims[v]);
      q[d] = 1;

      for (x[d] = -1; x[d] < dims[d]; ) {
        // Build the mask.
        let n = 0;
        for (x[v] = 0; x[v] < dims[v]; x[v]++) {
          for (x[u] = 0; x[u] < dims[u]; x[u]++) {
            const a = this._sampleAt(x[0], x[1], x[2], neighborSample);
            const b = this._sampleAt(x[0] + q[0], x[1] + q[1], x[2] + q[2], neighborSample);
            const aSolid = a !== Block.AIR;
            const bSolid = b !== Block.AIR;
            const aTrans = isTransparent(a);
            const bTrans = isTransparent(b);
            // face only if one side is solid/opaque and the other is transparent/air
            if (aSolid === bSolid) { mask[n++] = 0; continue; }
            if (aTrans === bTrans) { mask[n++] = 0; continue; }
            const blockId = aSolid ? a : b;
            const dirSign = aSolid ? 1 : -1; // direction the face points
            mask[n++] = (blockId << 4) | (dirSign > 0 ? (d + 1) : (d + 1) | 0x8);
          }
        }
        x[d]++;
        // Greedy merge.
        n = 0;
        for (let j = 0; j < dims[v]; j++) {
          for (let i = 0; i < dims[u]; ) {
            const c = mask[n];
            if (!c) { i++; n++; continue; }
            const blockId = c >> 4;
            const faceCode = c & 0xF;
            // Determine face type for UV (top/side/bottom).
            const axis = (faceCode & 0x7) - 1; // 0,1,2
            const sign = (faceCode & 0x8) ? -1 : 1;
            let faceType = 'side';
            if (axis === 1 && sign === 1) faceType = 'top';
            else if (axis === 1 && sign === -1) faceType = 'bottom';

            // Width and height of this quad.
            let w = 1;
            while (i + w < dims[u] && mask[n + w] === c) w++;
            let h = 1;
            let done = false;
            while (j + h < dims[v]) {
              for (let k = 0; k < w; k++) {
                if (mask[n + k + h * dims[u]] !== c) { done = true; break; }
              }
              if (done) break;
              h++;
            }

            // Add quad to the proper buffer.
            const buf = isTransparent(blockId) ? buffers.transparent : buffers.opaque;
            this._addQuad(buf, x, u, v, i, j, w, h, dims, sign, axis, blockId, faceType, uvMap);

            // Zero out the mask.
            for (let l = 0; l < h; l++) {
              for (let k = 0; k < w; k++) mask[n + k + l * dims[u]] = 0;
            }
            i += w; n += w;
          }
        }
      }
    }

    for (const [name, buf] of Object.entries(buffers)) {
      if (buf.pos.length === 0) continue;
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(buf.pos, 3));
      geom.setAttribute('normal',   new THREE.Float32BufferAttribute(buf.norm, 3));
      geom.setAttribute('uv',       new THREE.Float32BufferAttribute(buf.uv, 2));
      geom.setAttribute('color',    new THREE.Float32BufferAttribute(buf.col, 3));
      geom.setIndex(buf.idx);
      geom.computeBoundingSphere();
      const mat = name === 'transparent'
        ? new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
        : new THREE.MeshLambertMaterial({ vertexColors: true });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.frustumCulled = true;
      this.group.add(mesh);
    }
    this.dirty = false;
  }

  _sampleAt(x, y, z, neighborSample) {
    if (x >= 0 && x < CHUNK_SIZE && y >= 0 && y < CHUNK_HEIGHT && z >= 0 && z < CHUNK_SIZE) {
      return this.data[Chunk.idx(x, y, z)];
    }
    if (neighborSample) {
      const wx = this.cx * CHUNK_SIZE + x;
      const wz = this.cz * CHUNK_SIZE + z;
      return neighborSample(wx, y, wz);
    }
    return Block.AIR;
  }

  _addQuad(buf, x, u, v, i, j, w, h, dims, sign, axis, blockId, faceType, uvMap) {
    const du = [0, 0, 0]; du[u] = w;
    const dv = [0, 0, 0]; dv[v] = h;
    const base = [x[0], x[1], x[2]];
    if (sign < 0) {
      // shift to the back of the cell along the working axis
      base[axis]--;
    }
    const p0 = [base[0], base[1], base[2]];
    const p1 = [base[0] + du[0], base[1] + du[1], base[2] + du[2]];
    const p2 = [base[0] + du[0] + dv[0], base[1] + du[1] + dv[1], base[2] + du[2] + dv[2]];
    const p3 = [base[0] + dv[0], base[1] + dv[1], base[2] + dv[2]];
    const normal = [0, 0, 0]; normal[axis] = sign;

    const startIdx = buf.pos.length / 3;
    for (const p of [p0, p1, p2, p3]) {
      buf.pos.push(p[0], p[1], p[2]);
      buf.norm.push(normal[0], normal[1], normal[2]);
      buf.col.push(1, 1, 1); // AO can modulate here
    }
    // UVs
    const uv = uvMap[blockId]?.[faceType] || [0, 0, 1, 1];
    buf.uv.push(uv[0], uv[1], uv[2], uv[1], uv[2], uv[3], uv[0], uv[3]);
    // Indices (two triangles).
    buf.idx.push(startIdx, startIdx + 1, startIdx + 2, startIdx, startIdx + 2, startIdx + 3);
  }

  dispose() {
    this.group.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
    this.group.clear();
  }
}
