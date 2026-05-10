const express = require('express');
const bcrypt  = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db      = require('../db');
const { authenticate } = require('../middleware/auth');
const { requireRole }  = require('../middleware/rbac');

const router = express.Router();

// GET /api/users — All authenticated users (for assignee dropdowns)
router.get('/', authenticate, (req, res) => {
  const users = db.prepare(`
    SELECT id, name, email, role, avatar, bio, job_title, created_at FROM users ORDER BY name ASC
  `).all();
  res.json({ users });
});

// GET /api/users/:id — Admin or self
router.get('/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (req.user.role !== 'admin' && req.user.id !== id) {
    return res.status(403).json({ message: 'Access denied.' });
  }
  const user = db.prepare('SELECT id, name, email, role, avatar, bio, job_title, created_at FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json({ user });
});

// PATCH /api/users/:id/role — Admin only
router.patch('/:id/role', authenticate, requireRole('admin'), [
  body('role').isIn(['admin','member']).withMessage('Invalid role'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const id = parseInt(req.params.id, 10);
  if (id === req.user.id) return res.status(400).json({ message: 'Cannot change your own role.' });

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(req.body.role, id);

  db.prepare('INSERT INTO activity_log (user_id, action, entity, entity_id, meta) VALUES (?, ?, ?, ?, ?)').run(
    req.user.id, 'changed_role', 'user', id, JSON.stringify({ new_role: req.body.role })
  );

  const updated = db.prepare('SELECT id, name, email, role, avatar, bio, job_title, created_at FROM users WHERE id = ?').get(id);
  res.json({ user: updated });
});

// PUT /api/users/:id/details — Admin only
router.put('/:id/details', authenticate, requireRole('admin'), [
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('bio').optional({ nullable: true }).trim().isLength({ max: 500 }),
  body('job_title').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('password').optional({ nullable: true }).isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const id = parseInt(req.params.id, 10);
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  const { name, bio, job_title, password } = req.body;

  if (name) db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), id);
  if (bio !== undefined) db.prepare('UPDATE users SET bio = ? WHERE id = ?').run(bio, id);
  if (job_title !== undefined) db.prepare('UPDATE users SET job_title = ? WHERE id = ?').run(job_title, id);
  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, id);
  }

  const updated = db.prepare('SELECT id, name, email, role, avatar, bio, job_title, created_at FROM users WHERE id = ?').get(id);
  res.json({ user: updated, message: 'User updated successfully.' });
});

// DELETE /api/users/:id — Admin only
router.delete('/:id', authenticate, requireRole('admin'), (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id === req.user.id) return res.status(400).json({ message: 'Cannot delete yourself.' });

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ message: 'User deleted successfully.' });
});

module.exports = router;
