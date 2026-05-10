const express = require('express');
const { body, validationResult } = require('express-validator');
const db      = require('../db');
const { authenticate } = require('../middleware/auth');
const { requireRole, requireProjectOwnerOrAdmin } = require('../middleware/rbac');

const router = express.Router();

const getProjectWithDetails = (id, userId, role) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  if (!project) return null;

  // Check membership
  if (role !== 'admin') {
    const isMember = db.prepare(
      'SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(id, userId);
    if (!isMember) return null; // not accessible
  }

  project.owner = db.prepare('SELECT id, name, email, avatar FROM users WHERE id = ?').get(project.owner_id);
  project.members = db.prepare(`
    SELECT u.id, u.name, u.email, u.avatar, u.role, pm.joined_at
    FROM project_members pm JOIN users u ON pm.user_id = u.id
    WHERE pm.project_id = ?
  `).all(id);
  project.task_counts = db.prepare(`
    SELECT status, COUNT(*) as count FROM tasks WHERE project_id = ? GROUP BY status
  `).all(id);
  return project;
};

// GET /api/projects
router.get('/', authenticate, (req, res) => {
  let projects;
  if (req.user.role === 'admin') {
    projects = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all();
  } else {
    projects = db.prepare(`
      SELECT p.* FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = ?
      ORDER BY p.updated_at DESC
    `).all(req.user.id);
  }

  projects = projects.map(p => {
    p.owner = db.prepare('SELECT id, name, email, avatar FROM users WHERE id = ?').get(p.owner_id);
    p.member_count = db.prepare('SELECT COUNT(*) as c FROM project_members WHERE project_id = ?').get(p.id).c;
    p.task_counts = db.prepare(`
      SELECT status, COUNT(*) as count FROM tasks WHERE project_id = ? GROUP BY status
    `).all(p.id);
    return p;
  });

  res.json({ projects });
});

// POST /api/projects
router.post('/', authenticate, requireRole('admin', 'manager'), [
  body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('status').optional().isIn(['active','on_hold','completed','archived']),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { name, description = '', status = 'active' } = req.body;
  const result = db.prepare(
    'INSERT INTO projects (name, description, status, owner_id) VALUES (?, ?, ?, ?)'
  ).run(name, description, status, req.user.id);

  // Auto-add owner as member
  db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)').run(
    result.lastInsertRowid, req.user.id
  );

  db.prepare('INSERT INTO activity_log (user_id, action, entity, entity_id) VALUES (?, ?, ?, ?)').run(
    req.user.id, 'created', 'project', result.lastInsertRowid
  );

  const project = getProjectWithDetails(result.lastInsertRowid, req.user.id, req.user.role);
  res.status(201).json({ project });
});

// GET /api/projects/:id
router.get('/:id', authenticate, (req, res) => {
  const project = getProjectWithDetails(parseInt(req.params.id), req.user.id, req.user.role);
  if (!project) return res.status(404).json({ message: 'Project not found or access denied.' });
  res.json({ project });
});

// PUT /api/projects/:id
router.put('/:id', authenticate, requireProjectOwnerOrAdmin(db), [
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('status').optional().isIn(['active','on_hold','completed','archived']),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const id = parseInt(req.params.id);
  const { name, description, status } = req.body;

  if (name)        db.prepare('UPDATE projects SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(name, id);
  if (description !== undefined) db.prepare('UPDATE projects SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(description, id);
  if (status)      db.prepare('UPDATE projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);

  db.prepare('INSERT INTO activity_log (user_id, action, entity, entity_id) VALUES (?, ?, ?, ?)').run(
    req.user.id, 'updated', 'project', id
  );

  const project = getProjectWithDetails(id, req.user.id, req.user.role);
  res.json({ project });
});

// DELETE /api/projects/:id
router.delete('/:id', authenticate, requireRole('admin', 'manager'), requireProjectOwnerOrAdmin(db), (req, res) => {
  const id = parseInt(req.params.id);
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  res.json({ message: 'Project deleted successfully.' });
});

// POST /api/projects/:id/members
router.post('/:id/members', authenticate, requireRole('admin', 'manager'), (req, res) => {
  const projectId = parseInt(req.params.id);
  const { userId } = req.body;
  if (!userId) return res.status(422).json({ message: 'userId is required.' });

  const project = db.prepare('SELECT id, owner_id FROM projects WHERE id = ?').get(projectId);
  if (!project) return res.status(404).json({ message: 'Project not found.' });

  if (req.user.role !== 'admin' && project.owner_id !== req.user.id)
    return res.status(403).json({ message: 'Only project owner or admin can add members.' });

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)').run(projectId, userId);
  res.json({ message: 'Member added successfully.' });
});

// DELETE /api/projects/:id/members/:uid
router.delete('/:id/members/:uid', authenticate, requireRole('admin', 'manager'), (req, res) => {
  const projectId = parseInt(req.params.id);
  const userId    = parseInt(req.params.uid);

  const project = db.prepare('SELECT id, owner_id FROM projects WHERE id = ?').get(projectId);
  if (!project) return res.status(404).json({ message: 'Project not found.' });

  if (req.user.role !== 'admin' && project.owner_id !== req.user.id)
    return res.status(403).json({ message: 'Only project owner or admin can remove members.' });

  if (project.owner_id === userId)
    return res.status(400).json({ message: 'Cannot remove project owner.' });

  db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(projectId, userId);
  res.json({ message: 'Member removed successfully.' });
});

module.exports = router;
