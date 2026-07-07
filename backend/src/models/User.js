// User data-access object.
import bcrypt from 'bcrypt';
import { getDB } from '../database/db.js';

export const User = {
  create({ username, password, isGuest = false }) {
    const db = getDB();
    const hashed = password ? bcrypt.hashSync(password, 12) : null;
    const stmt = db.prepare(
      `INSERT INTO users (username, password, is_guest, created_at)
       VALUES (?, ?, ?, ?)`
    );
    const now = Date.now();
    const info = stmt.run(username, hashed, isGuest ? 1 : 0, now);
    return { id: info.lastInsertRowid, username, is_guest: isGuest };
  },

  findById(id) {
    return getDB().prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  findByUsername(username) {
    return getDB().prepare('SELECT * FROM users WHERE username = ?').get(username);
  },

  verifyPassword(user, password) {
    if (!user.password) return false;
    return bcrypt.compareSync(password, user.password);
  },

  generateGuestName() {
    const adjectives = ['Quick', 'Brave', 'Sly', 'Mighty', 'Swift', 'Clever', 'Bold'];
    const nouns = ['Miner', 'Builder', 'Crafter', 'Wanderer', 'Pioneer', 'Scout'];
    const n = Math.floor(Math.random() * 1000);
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${n}`;
  },
};
