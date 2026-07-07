// World CRUD operations.
import { getDB } from '../database/db.js';

export const World = {
  listByUser(userId) {
    return getDB().prepare(
      'SELECT * FROM worlds WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId);
  },

  findById(id) {
    return getDB().prepare('SELECT * FROM worlds WHERE id = ?').get(id);
  },

  create({ userId, name, seed, gamemode = 'creative' }) {
    const db = getDB();
    const info = db.prepare(
      `INSERT INTO worlds (user_id, name, seed, gamemode, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(userId, name, seed, gamemode, Date.now());
    return this.findById(info.lastInsertRowid);
  },

  delete(id, userId) {
    return getDB().prepare(
      'DELETE FROM worlds WHERE id = ? AND user_id = ?'
    ).run(id, userId);
  },

  savePosition({ worldId, userId, x, y, z, yaw, pitch }) {
    getDB().prepare(
      `INSERT INTO player_state (user_id, world_id, x, y, z, yaw, pitch, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, world_id) DO UPDATE SET
         x=excluded.x, y=excluded.y, z=excluded.z,
         yaw=excluded.yaw, pitch=excluded.pitch, updated_at=excluded.updated_at`
    ).run(userId, worldId, x, y, z, yaw, pitch, Date.now());
  },

  loadPosition(userId, worldId) {
    return getDB().prepare(
      'SELECT * FROM player_state WHERE user_id = ? AND world_id = ?'
    ).get(userId, worldId);
  },
};
