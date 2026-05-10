const express  = require('express');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const db        = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', [
  body('name')
    .trim()
    .notEmpty().withMessage('Full name is required.')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters.'),
  body('email')
    .isEmail().withMessage('A valid email address is required.')
    .matches(/@gmail\.com$/).withMessage('Only Gmail addresses (@gmail.com) are accepted.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character (!@#$ etc).'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Passwords do not match.');
    return true;
  }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: errors.array()[0].msg, errors: errors.array() });
  }

  const { name, email, password } = req.body;

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ message: 'This email is already registered.' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
  ).run(name, email, hash, 'member');

  const user = db.prepare('SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
  const tokens = generateTokens(user);

  db.prepare('INSERT INTO activity_log (user_id, action, entity, entity_id) VALUES (?, ?, ?, ?)').run(
    user.id, 'registered', 'user', user.id
  );

  res.status(201).json({ user, ...tokens });
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ message: errors.array()[0].msg });

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

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
// Generates a 6-digit OTP and stores it (in production, send via email service)
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email required.').normalizeEmail(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ message: errors.array()[0].msg });

  const { email } = req.body;
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

  // Always respond with success to prevent email enumeration
  if (!user) {
    return res.json({ message: 'If this email is registered, a reset code has been sent.' });
  }

  // Generate 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

  // Invalidate old codes for this email
  db.prepare('UPDATE password_resets SET used = 1 WHERE email = ?').run(email);

  // Store new code
  db.prepare('INSERT INTO password_resets (email, code, expires_at) VALUES (?, ?, ?)').run(email, code, expiresAt);

  // In development, log the code to console (in production, send email via nodemailer/sendgrid)
  console.log(`\n📧 Password reset code for ${email}: ${code} (expires in 15 min)\n`);

  res.json({
    message: 'If this email is registered, a reset code has been sent.',
    // dev_only_code is exposed only in development for testing
    ...(process.env.NODE_ENV !== 'production' && { dev_code: code })
  });
});

// ── POST /api/auth/reset-password ────────────────────────────────────────────
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits.'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain a number.')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain a special character.'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ message: errors.array()[0].msg });

  const { email, code, password } = req.body;

  const record = db.prepare(
    'SELECT * FROM password_resets WHERE email = ? AND code = ? AND used = 0 ORDER BY id DESC LIMIT 1'
  ).get(email, code);

  if (!record) return res.status(400).json({ message: 'Invalid or expired reset code.' });
  if (new Date(record.expires_at) < new Date()) {
    return res.status(400).json({ message: 'Reset code has expired. Please request a new one.' });
  }

  const hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hash, email);
  db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(record.id);

  res.json({ message: 'Password reset successfully. You can now log in.' });
});

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
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

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// ── PATCH /api/auth/profile ───────────────────────────────────────────────────
router.patch('/profile', authenticate, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ message: errors.array()[0].msg });

  const { name, avatar } = req.body;
  if (name)   db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.user.id);
  if (avatar) db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatar, req.user.id);

  const updated = db.prepare('SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: updated });
});

// ── POST /api/auth/google ────────────────────────────────────────────────────
// Accepts a Google credential (ID token) from the frontend and signs the user in
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ message: 'Google credential required.' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture, email_verified } = payload;

    if (!email_verified) return res.status(401).json({ message: 'Google email not verified.' });
    if (!email.endsWith('@gmail.com')) return res.status(422).json({ message: 'Only Gmail accounts are accepted.' });

    // Find or create user
    let user = db.prepare('SELECT id, name, email, role, avatar, created_at FROM users WHERE email = ?').get(email);

    if (!user) {
      // New user — register with Google
      const result = db.prepare(
        'INSERT INTO users (name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?)'
      ).run(name, email, 'GOOGLE_OAUTH', 'member', picture);
      user = db.prepare('SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
      db.prepare('INSERT INTO activity_log (user_id, action, entity, entity_id) VALUES (?, ?, ?, ?)').run(
        user.id, 'registered_via_google', 'user', user.id
      );
    } else {
      // Update avatar from Google if not set
      if (!user.avatar && picture) {
        db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(picture, user.id);
        user.avatar = picture;
      }
      db.prepare('INSERT INTO activity_log (user_id, action, entity, entity_id) VALUES (?, ?, ?, ?)').run(
        user.id, 'logged_in_via_google', 'user', user.id
      );
    }

    const tokens = generateTokens(user);
    res.json({ user, ...tokens });
  } catch (err) {
    console.error('Google OAuth error:', err.message);
    res.status(401).json({ message: 'Invalid Google token. Please try again.' });
  }
});

// ── POST /api/auth/google-access ────────────────────────────────────────────
// Works with useGoogleLogin() which returns an access_token (not ID token)
// We fetch user info from Google's userinfo endpoint and sign them in
router.post('/google-access', async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) return res.status(400).json({ message: 'Access token required.' });

  try {
    // Fetch user profile from Google
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch Google user info');
    const { email, name, picture, email_verified } = await response.json();

    if (!email_verified) return res.status(401).json({ message: 'Google email not verified.' });
    if (!email.endsWith('@gmail.com')) return res.status(422).json({ message: 'Only Gmail accounts are accepted.' });

    // Find or create user
    let user = db.prepare('SELECT id, name, email, role, avatar, created_at FROM users WHERE email = ?').get(email);

    if (!user) {
      const result = db.prepare(
        'INSERT INTO users (name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?)'
      ).run(name, email, 'GOOGLE_OAUTH', 'member', picture);
      user = db.prepare('SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
      db.prepare('INSERT INTO activity_log (user_id, action, entity, entity_id) VALUES (?, ?, ?, ?)').run(
        user.id, 'registered_via_google', 'user', user.id
      );
    } else {
      if (!user.avatar && picture) {
        db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(picture, user.id);
        user.avatar = picture;
      }
      db.prepare('INSERT INTO activity_log (user_id, action, entity, entity_id) VALUES (?, ?, ?, ?)').run(
        user.id, 'logged_in_via_google', 'user', user.id
      );
    }

    const tokens = generateTokens(user);
    res.json({ user, ...tokens });
  } catch (err) {
    console.error('Google access-token OAuth error:', err.message);
    res.status(401).json({ message: 'Google sign-in failed. Please try again.' });
  }
});

module.exports = router;
