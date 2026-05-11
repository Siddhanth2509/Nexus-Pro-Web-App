const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'database.sqlite');

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ──────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    role       TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin','member')),
    avatar     TEXT,
    bio        TEXT,
    job_title  TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','on_hold','completed','archived')),
    owner_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS project_members (
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','in_progress','in_review','done')),
    priority    TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high','urgent')),
    due_date    DATE,
    project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action     TEXT NOT NULL,
    entity     TEXT NOT NULL,
    entity_id  INTEGER,
    meta       TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT NOT NULL,
    code       TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    used       INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS task_labels (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    label      TEXT NOT NULL,
    color      TEXT DEFAULT '#6366f1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, label)
  );

  CREATE TABLE IF NOT EXISTS task_comments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ─── Auto-Migrations ──────────────────────────────────────────────────────────
try { db.prepare('ALTER TABLE users ADD COLUMN bio TEXT;').run(); } catch(e) {}
try { db.prepare('ALTER TABLE users ADD COLUMN job_title TEXT;').run(); } catch(e) {}
try { db.prepare("UPDATE users SET role = 'admin' WHERE role = 'manager';").run(); } catch(e) {}
try { db.prepare('CREATE TABLE IF NOT EXISTS task_labels (id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE, label TEXT NOT NULL, color TEXT DEFAULT "#6366f1", created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(task_id, label));').run(); } catch(e) {}
try { db.prepare('CREATE TABLE IF NOT EXISTS task_comments (id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, content TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);').run(); } catch(e) {}

// ─── Seed Admin User ──────────────────────────────────────────────────────────

const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@ethara.ai');
if (!existingAdmin) {
  const hash = bcrypt.hashSync('Admin@123', 10);
  db.prepare(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`).run(
    'Admin User', 'admin@ethara.ai', hash, 'admin'
  );

  const memberHash = bcrypt.hashSync('Member@123', 10);
  db.prepare(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`).run(
    'John Member', 'member@ethara.ai', memberHash, 'member'
  );

  // Seed sample project
  const adminUser = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@ethara.ai');
  const member    = db.prepare('SELECT id FROM users WHERE email = ?').get('member@ethara.ai');

  const proj = db.prepare(`
    INSERT INTO projects (name, description, status, owner_id)
    VALUES (?, ?, ?, ?)
  `).run('Ethara Platform v2', 'Redesign and rebuild the core platform', 'active', adminUser.id);

  db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)').run(proj.lastInsertRowid, adminUser.id);
  db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)').run(proj.lastInsertRowid, member.id);

  const tasks = [
    ['Design new dashboard UI', 'Create wireframes and mockups for the dashboard', 'done', 'high', member.id],
    ['Set up backend API', 'Initialize Express server and database schema', 'done', 'urgent', member.id],
    ['Implement authentication', 'JWT-based auth with refresh tokens', 'in_progress', 'urgent', member.id],
    ['Build project management CRUD', 'Projects and tasks endpoints', 'in_progress', 'high', member.id],
    ['Write API documentation', 'Document all endpoints with examples', 'todo', 'medium', member.id],
    ['Setup CI/CD pipeline', 'GitHub Actions for automated testing', 'todo', 'low', member.id],
  ];

  for (const [title, description, status, priority, assignee_id] of tasks) {
    db.prepare(`
      INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, created_by, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, date('now', '+7 days'))
    `).run(title, description, status, priority, proj.lastInsertRowid, assignee_id, adminUser.id);
  }

  console.log('✅ Database seeded with sample data');
  console.log('   Admin:   admin@ethara.ai   / Admin@123');
  console.log('   Member:  member@ethara.ai  / Member@123');
}

module.exports = db;
