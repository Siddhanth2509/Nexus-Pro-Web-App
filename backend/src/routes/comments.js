const express = require('express');
const { body, param, validationResult } = require('express-validator');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/tasks/:taskId/comments
router.get('/:taskId/comments', authenticate, [
  param('taskId').isInt().withMessage('Task ID must be an integer'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { taskId } = req.params;

  // Verify user has access to the task's project
  const task = db.prepare('SELECT project_id FROM tasks WHERE id = ?').get(taskId);
  if (!task) return res.status(404).json({ message: 'Task not found.' });

  const isAdmin = req.user.role === 'admin';
  const isMember = db.prepare(
    'SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?'
  ).get(task.project_id, req.user.id);

  if (!isAdmin && !isMember) {
    return res.status(403).json({ message: 'You do not have access to this task.' });
  }

  const comments = db.prepare(`
    SELECT 
      c.id, c.task_id, c.user_id, c.content, c.created_at, c.updated_at,
      u.name, u.email, u.avatar
    FROM task_comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.task_id = ?
    ORDER BY c.created_at DESC
  `).all(taskId);

  res.json({ comments });
});

// POST /api/tasks/:taskId/comments
router.post('/:taskId/comments', authenticate, [
  param('taskId').isInt().withMessage('Task ID must be an integer'),
  body('content').trim().notEmpty().withMessage('Comment content is required').isLength({ max: 2000 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { taskId } = req.params;
  const { content } = req.body;

  // Verify task exists and user has access
  const task = db.prepare('SELECT project_id FROM tasks WHERE id = ?').get(taskId);
  if (!task) return res.status(404).json({ message: 'Task not found.' });

  const isAdmin = req.user.role === 'admin';
  const isMember = db.prepare(
    'SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?'
  ).get(task.project_id, req.user.id);

  if (!isAdmin && !isMember) {
    return res.status(403).json({ message: 'You do not have access to this task.' });
  }

  const result = db.prepare(`
    INSERT INTO task_comments (task_id, user_id, content)
    VALUES (?, ?, ?)
  `).run(taskId, req.user.id, content);

  const comment = db.prepare(`
    SELECT 
      c.id, c.task_id, c.user_id, c.content, c.created_at, c.updated_at,
      u.name, u.email, u.avatar
    FROM task_comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(result.lastInsertRowid);

  // Log activity
  db.prepare('INSERT INTO activity_log (user_id, action, entity, entity_id) VALUES (?, ?, ?, ?)').run(
    req.user.id, 'commented_on_task', 'task', taskId
  );

  res.status(201).json(comment);
});

// DELETE /api/tasks/:taskId/comments/:commentId
router.delete('/:taskId/comments/:commentId', authenticate, [
  param('taskId').isInt(),
  param('commentId').isInt(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { taskId, commentId } = req.params;

  // Verify task exists and user has access
  const task = db.prepare('SELECT project_id FROM tasks WHERE id = ?').get(taskId);
  if (!task) return res.status(404).json({ message: 'Task not found.' });

  // Verify comment exists and belongs to this task
  const comment = db.prepare('SELECT user_id FROM task_comments WHERE id = ? AND task_id = ?').get(commentId, taskId);
  if (!comment) return res.status(404).json({ message: 'Comment not found.' });

  // Only comment author or admin can delete
  if (req.user.role !== 'admin' && comment.user_id !== req.user.id) {
    return res.status(403).json({ message: 'You can only delete your own comments.' });
  }

  db.prepare('DELETE FROM task_comments WHERE id = ?').run(commentId);

  res.json({ message: 'Comment deleted.' });
});

module.exports = router;
