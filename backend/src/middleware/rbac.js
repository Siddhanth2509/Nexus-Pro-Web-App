// Role hierarchy: admin > manager > member
const ROLE_LEVELS = { admin: 3, manager: 2, member: 1 };

/**
 * Require at least a minimum role level
 * Usage: requireRole('admin') or requireRole('manager')
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated.' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied. Requires one of: ${roles.join(', ')}. Your role: ${req.user.role}.`
    });
  }
  next();
};

/**
 * Check if user is project owner or admin
 */
const requireProjectOwnerOrAdmin = (db) => (req, res, next) => {
  const projectId = parseInt(req.params.id, 10);
  const project = db.prepare('SELECT owner_id FROM projects WHERE id = ?').get(projectId);
  if (!project) return res.status(404).json({ message: 'Project not found.' });
  if (req.user.role === 'admin' || project.owner_id === req.user.id) return next();
  return res.status(403).json({ message: 'Only the project owner or admin can perform this action.' });
};

module.exports = { requireRole, requireProjectOwnerOrAdmin };
