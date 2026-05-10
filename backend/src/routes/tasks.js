const express = require('express');
const { body, query, validationResult } = require('express-validator');
const db      = require('../db');
const { authenticate } = require('../middleware/auth');
const { requireRole }  = require('../middleware/rbac');

const router = express.Router();

const enrichTask = (task) => {
  if (!task) return null;
  task.assignee = task.assignee_id
    ? db.prepare('SELECT id, name, email, avatar FROM users WHERE id = ?').get(task.assignee_id)
    : null;
  task.created_by_user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(task.created_by);
  task.project = db.prepare('SELECT id, name FROM projects WHERE id = ?').get(task.project_id);
  return task;
};

const canAccessProject = (projectId, userId, role) => {
  if (role === 'admin') return true;
  return !!db.prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, userId);
};

// GET /api/tasks
router.get('/', authenticate, [
  query('project_id').optional().isInt(),
  query('status').optional().isIn(['todo','in_progress','in_review','done']),
  query('priority').optional().isIn(['low','medium','high','urgent']),
  query('assignee_id').optional().isInt(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  let sql = 'SELECT * FROM tasks WHERE 1=1';
  const params = [];

  // Non-admins can only see tasks in projects they're members of
  if (req.user.role !== 'admin') {
    sql += ' AND project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)';
    params.push(req.user.id);
  }

  if (req.query.project_id) { sql += ' AND project_id = ?'; params.push(req.query.project_id); }
  if (req.query.status)     { sql += ' AND status = ?';     params.push(req.query.status); }
  if (req.query.priority)   { sql += ' AND priority = ?';   params.push(req.query.priority); }
  if (req.query.assignee_id){ sql += ' AND assignee_id = ?';params.push(req.query.assignee_id); }

  sql += ' ORDER BY created_at DESC';

  const tasks = db.prepare(sql).all(...params).map(enrichTask);
  res.json({ tasks });
});

// POST /api/tasks
router.post('/', authenticate, requireRole('admin', 'manager'), [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('status').optional().isIn(['todo','in_progress','in_review','done']),
  body('priority').optional().isIn(['low','medium','high','urgent']),
  body('due_date').optional().isISO8601().toDate().withMessage('Valid date required'),
  body('project_id').isInt().withMessage('project_id is required'),
  body('assignee_id').optional().isInt(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { title, description = '', status = 'todo', priority = 'medium', due_date, project_id, assignee_id } = req.body;

  if (!canAccessProject(project_id, req.user.id, req.user.role)) {
    return res.status(403).json({ message: 'You do not have access to this project.' });
  }

  if (assignee_id) {
    const memberCheck = db.prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?').get(project_id, assignee_id);
    if (!memberCheck) return res.status(400).json({ message: 'Assignee must be a project member.' });
  }

  const result = db.prepare(`
    INSERT INTO tasks (title, description, status, priority, due_date, project_id, assignee_id, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, description, status, priority, due_date || null, project_id, assignee_id || null, req.user.id);

  db.prepare('INSERT INTO activity_log (user_id, action, entity, entity_id) VALUES (?, ?, ?, ?)').run(
    req.user.id, 'created', 'task', result.lastInsertRowid
  );

  const task = enrichTask(db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid));
  res.status(201).json({ task });
});

// GET /api/tasks/:id
router.get('/:id', authenticate, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found.' });

  if (!canAccessProject(task.project_id, req.user.id, req.user.role)) {
    return res.status(403).json({ message: 'Access denied.' });
  }
  res.json({ task: enrichTask(task) });
});

// PUT /api/tasks/:id
router.put('/:id', authenticate, [
  body('title').optional().trim().notEmpty().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('status').optional().isIn(['todo','in_progress','in_review','done']),
  body('priority').optional().isIn(['low','medium','high','urgent']),
  body('due_date').optional({ nullable: true }).isISO8601().toDate(),
  body('assignee_id').optional({ nullable: true }).isInt(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found.' });

  if (!canAccessProject(task.project_id, req.user.id, req.user.role)) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  // Members can only update status of their own tasks
  if (req.user.role === 'member') {
    if (task.assignee_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only update tasks assigned to you.' });
    }
    const allowed = Object.keys(req.body).filter(k => !['status'].includes(k));
    if (allowed.length > 0) {
      return res.status(403).json({ message: 'Members can only update task status.' });
    }
  }

  const { title, description, status, priority, due_date, assignee_id } = req.body;

  if (title !== undefined)       db.prepare('UPDATE tasks SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(title, task.id);
  if (description !== undefined) db.prepare('UPDATE tasks SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(description, task.id);
  if (status !== undefined)      db.prepare('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, task.id);
  if (priority !== undefined)    db.prepare('UPDATE tasks SET priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(priority, task.id);
  if (due_date !== undefined)    db.prepare('UPDATE tasks SET due_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(due_date, task.id);
  if (assignee_id !== undefined) db.prepare('UPDATE tasks SET assignee_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(assignee_id, task.id);

  db.prepare('INSERT INTO activity_log (user_id, action, entity, entity_id) VALUES (?, ?, ?, ?)').run(
    req.user.id, 'updated', 'task', task.id
  );

  const updated = enrichTask(db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id));
  res.json({ task: updated });
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticate, requireRole('admin', 'manager'), (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found.' });

  if (!canAccessProject(task.project_id, req.user.id, req.user.role)) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(task.id);
  res.json({ message: 'Task deleted successfully.' });
});

module.exports = router;
