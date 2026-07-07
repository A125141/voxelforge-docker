// Idempotent schema migrations.
export function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT,
      is_guest INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS worlds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      seed INTEGER NOT NULL,
      gamemode TEXT DEFAULT 'creative',
      last_x REAL DEFAULT 0,
      last_y REAL DEFAULT 64,
      last_z REAL DEFAULT 0,
      last_yaw REAL DEFAULT 0,
      last_pitch REAL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS player_state (
      user_id INTEGER NOT NULL,
      world_id INTEGER NOT NULL,
      x REAL DEFAULT 0,
      y REAL DEFAULT 64,
      z REAL DEFAULT 0,
      yaw REAL DEFAULT 0,
      pitch REAL DEFAULT 0,
      health REAL DEFAULT 20,
      hunger REAL DEFAULT 20,
      hotbar TEXT DEFAULT '',
      inventory TEXT DEFAULT '',
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, world_id),
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_worlds_user ON worlds(user_id);
  `);
}
