const express = require('express');
const db      = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authenticate, (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const userId  = req.user.id;

  // Project stats
  const projectCount = isAdmin
    ? db.prepare('SELECT COUNT(*) as c FROM projects').get().c
    : db.prepare('SELECT COUNT(*) as c FROM project_members WHERE user_id = ?').get(userId).c;

  const projectsByStatus = isAdmin
    ? db.prepare('SELECT status, COUNT(*) as count FROM projects GROUP BY status').all()
    : db.prepare(`
        SELECT p.status, COUNT(*) as count FROM projects p
        JOIN project_members pm ON p.id = pm.project_id
        WHERE pm.user_id = ?
        GROUP BY p.status
      `).all(userId);

  // Task stats
  const tasksByStatus = isAdmin
    ? db.prepare('SELECT status, COUNT(*) as count FROM tasks GROUP BY status').all()
    : db.prepare(`
        SELECT t.status, COUNT(*) as count FROM tasks t
        JOIN project_members pm ON t.project_id = pm.project_id
        WHERE pm.user_id = ?
        GROUP BY t.status
      `).all(userId);

  const myTasks = isAdmin
    ? db.prepare('SELECT COUNT(*) as c FROM tasks').get().c
    : db.prepare('SELECT COUNT(*) as c FROM tasks WHERE assignee_id = ?').get(userId).c;

  const overdueTasks = isAdmin
    ? db.prepare("SELECT COUNT(*) as c FROM tasks WHERE due_date < date('now') AND status != 'done'").get().c
    : db.prepare("SELECT COUNT(*) as c FROM tasks WHERE assignee_id = ? AND due_date < date('now') AND status != 'done'").get(userId).c;

  const urgentTasks = isAdmin
    ? db.prepare("SELECT COUNT(*) as c FROM tasks WHERE priority = 'urgent' AND status != 'done'").get().c
    : db.prepare("SELECT COUNT(*) as c FROM tasks WHERE assignee_id = ? AND priority = 'urgent' AND status != 'done'").get(userId).c;

  // Recent activity
  const recentActivity = db.prepare(`
    SELECT a.*, u.name as user_name, u.avatar as user_avatar
    FROM activity_log a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT 10
  `).all();

  // User count (admin only)
  const userCount = isAdmin ? db.prepare('SELECT COUNT(*) as c FROM users').get().c : null;

  // Task completion by priority
  const tasksByPriority = isAdmin
    ? db.prepare("SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority").all()
    : db.prepare("SELECT priority, COUNT(*) as count FROM tasks WHERE assignee_id = ? GROUP BY priority").all(userId);

  // Weekly task creation trend (last 7 days)
  const weeklyTrend = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as count
    FROM tasks
    WHERE created_at >= date('now', '-7 days')
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all();

  res.json({
    stats: {
      projectCount,
      myTasks,
      overdueTasks,
      urgentTasks,
      userCount,
    },
    projectsByStatus,
    tasksByStatus,
    tasksByPriority,
    weeklyTrend,
    recentActivity,
  });
});

module.exports = router;
