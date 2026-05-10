const express = require('express');
const db      = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authenticate, (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const uid     = req.user.id;

  const memberSql = isAdmin ? '' :
    ` AND t.project_id IN (SELECT project_id FROM project_members WHERE user_id = ${uid})`;

  const totalTasks     = db.prepare(`SELECT COUNT(*) as c FROM tasks t WHERE 1=1${memberSql}`).get().c;
  const activeTasks    = db.prepare(`SELECT COUNT(*) as c FROM tasks t WHERE status IN ('todo','in_progress')${memberSql}`).get().c;
  const completedTasks = db.prepare(`SELECT COUNT(*) as c FROM tasks t WHERE status = 'done'${memberSql}`).get().c;
  const overdueTasks   = db.prepare(`SELECT COUNT(*) as c FROM tasks t WHERE due_date < date('now') AND status != 'done'${memberSql}`).get().c;

  const totalProjects = isAdmin
    ? db.prepare('SELECT COUNT(*) as c FROM projects').get().c
    : db.prepare('SELECT COUNT(*) as c FROM project_members WHERE user_id = ?').get(uid).c;

  const statusRows = db.prepare(`SELECT status, COUNT(*) as count FROM tasks t WHERE 1=1${memberSql} GROUP BY status`).all();
  const statusBreakdown = { todo: 0, in_progress: 0, done: 0 };
  statusRows.forEach(r => { if (r.status in statusBreakdown) statusBreakdown[r.status] = r.count; });

  const priorityRows = db.prepare(`SELECT priority, COUNT(*) as count FROM tasks t WHERE 1=1${memberSql} GROUP BY priority`).all();
  const priorityBreakdown = { high: 0, medium: 0, low: 0 };
  priorityRows.forEach(r => { if (r.priority in priorityBreakdown) priorityBreakdown[r.priority] = r.count; });

  const recentRaw = db.prepare(`
    SELECT t.*, p.name as project_name, u.name as assignee_name, u.avatar as assignee_avatar
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE 1=1${memberSql}
    ORDER BY t.created_at DESC LIMIT 10
  `).all();

  const recentTasks = recentRaw.map(t => ({
    id: t.id, title: t.title, status: t.status, priority: t.priority,
    dueDate: t.due_date, projectName: t.project_name,
    assigneeName: t.assignee_name, assigneeAvatar: t.assignee_avatar,
    isOverdue: !!(t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date()),
  }));

  const recentActivity = db.prepare(`
    SELECT a.*, u.name as user_name FROM activity_log a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC LIMIT 10
  `).all();

  res.json({ totalTasks, activeTasks, completedTasks, overdueTasks, totalProjects,
    statusBreakdown, priorityBreakdown, recentTasks, recentActivity });
});

module.exports = router;
