const express  = require('express');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db        = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const generateTokens = (user) => {
  const access = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refresh = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { access, refresh };
};

// POST /api/auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
  body('role').optional().isIn(['admin','manager','member']).withMessage('Invalid role'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { name, email, password, role = 'member' } = req.body;

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ message: 'Email already registered.' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
  ).run(name, email, hash, role);

  const user = db.prepare('SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
  const tokens = generateTokens(user);

  // Log activity
  db.prepare('INSERT INTO activity_log (user_id, action, entity, entity_id) VALUES (?, ?, ?, ?)').run(
    user.id, 'registered', 'user', user.id
  );

  res.status(201).json({ user, ...tokens });
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ message: 'Invalid email or password.' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ message: 'Invalid email or password.' });

  const { password: _, ...safeUser } = user;
  const tokens = generateTokens(safeUser);

  db.prepare('INSERT INTO activity_log (user_id, action, entity, entity_id) VALUES (?, ?, ?, ?)').run(
    user.id, 'logged_in', 'user', user.id
  );

  res.json({ user: safeUser, ...tokens });
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'Refresh token required.' });
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = db.prepare('SELECT id, name, email, role, avatar FROM users WHERE id = ?').get(payload.id);
    if (!user) return res.status(401).json({ message: 'User not found.' });
    const tokens = generateTokens(user);
    res.json({ user, ...tokens });
  } catch {
    res.status(401).json({ message: 'Invalid or expired refresh token.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// PATCH /api/auth/profile
router.patch('/profile', authenticate, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { name, avatar } = req.body;
  if (name)   db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.user.id);
  if (avatar) db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatar, req.user.id);

  const updated = db.prepare('SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: updated });
});

module.exports = router;
