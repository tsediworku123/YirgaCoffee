const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

module.exports = function(db) {
  const router = express.Router();

  // Register
  router.post('/register', (req, res) => {
    try {
      const { name, email, password, phone, company } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const hash = bcrypt.hashSync(password, 12);
      const result = db.prepare('INSERT INTO users (name, email, password, phone, company) VALUES (?, ?, ?, ?, ?)')
        .run(name, email, hash, phone || '', company || '');

      const user = db.prepare('SELECT id, name, email, role, phone, company, created_at FROM users WHERE id = ?')
        .get(result.lastInsertRowid);

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

      res.status(201).json({ user, token });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // Login
  router.post('/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

      const { password: _, ...safeUser } = user;
      res.json({ user: safeUser, token });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Get current user
  router.get('/me', authenticate, (req, res) => {
    try {
      const user = db.prepare('SELECT id, name, email, role, phone, company, created_at FROM users WHERE id = ?')
        .get(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: 'Failed to get user' });
    }
  });

  // Update profile
  router.put('/me', authenticate, (req, res) => {
    try {
      const { name, phone, company } = req.body;
      db.prepare('UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), company = COALESCE(?, company) WHERE id = ?')
        .run(name, phone, company, req.user.id);
      const user = db.prepare('SELECT id, name, email, role, phone, company, created_at FROM users WHERE id = ?')
        .get(req.user.id);
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Change password
  router.put('/password', authenticate, (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
      if (!bcrypt.compareSync(currentPassword, user.password)) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      const hash = bcrypt.hashSync(newPassword, 12);
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, req.user.id);
      res.json({ message: 'Password updated' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to change password' });
    }
  });

  // Forgot password - sends reset token (email logging for now)
  router.post('/forgot-password', (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email is required' });

      const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email);
      if (!user) {
        // Don't reveal if user exists or not
        return res.json({ message: 'If an account exists, a reset link has been sent.' });
      }

      // Generate reset token (expires in 1 hour)
      const resetToken = require('crypto').randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 3600000).toISOString();

      // Store in a simple table or use JWT
      db.prepare(`
        CREATE TABLE IF NOT EXISTS password_resets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires_at DATETIME NOT NULL,
          used INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      db.prepare('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)')
        .run(user.id, resetToken, expires);

      // In production, send email here:
      // await sendEmail(user.email, 'Password Reset', `Click: ${baseUrl}/reset?token=${resetToken}`)
      console.log(`[PASSWORD RESET] ${user.email} → token: ${resetToken}`);
      console.log(`[PASSWORD RESET] Reset URL: http://localhost:3001/#/login?reset=${resetToken}`);

      res.json({ message: 'If an account exists, a reset link has been sent.', _dev_token: resetToken });
    } catch (err) {
      console.error('Forgot password error:', err);
      res.status(500).json({ error: 'Failed to process request' });
    }
  });

  // Reset password with token
  router.post('/reset-password', (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });
      if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

      // Create table if not exists
      db.prepare(`
        CREATE TABLE IF NOT EXISTS password_resets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires_at DATETIME NOT NULL,
          used INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      const reset = db.prepare('SELECT * FROM password_resets WHERE token = ? AND used = 0').get(token);
      if (!reset) return res.status(400).json({ error: 'Invalid or expired reset token' });

      if (new Date(reset.expires_at) < new Date()) {
        return res.status(400).json({ error: 'Reset token has expired' });
      }

      const hash = bcrypt.hashSync(newPassword, 12);
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, reset.user_id);
      db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(reset.id);

      res.json({ message: 'Password reset successful. You can now sign in.' });
    } catch (err) {
      console.error('Reset password error:', err);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  // Google sign-in (creates user if not exists)
  router.post('/google', (req, res) => {
    try {
      const { email, name, google_id } = req.body;
      if (!email || !google_id) return res.status(400).json({ error: 'Email and Google ID required' });

      let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

      if (!user) {
        // Create new user from Google
        const hash = bcrypt.hashSync(`google_${google_id}`, 12);
        const result = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)')
          .run(name || 'Google User', email, hash, 'customer');
        user = db.prepare('SELECT id, name, email, role, phone, company, created_at FROM users WHERE id = ?')
          .get(result.lastInsertRowid);
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

      if (!user.phone) {
        const { password: _, ...safeUser } = user;
        res.json({ user: safeUser, token });
      } else {
        const { password: _, ...safeUser } = user;
        res.json({ user: safeUser, token });
      }
    } catch (err) {
      console.error('Google auth error:', err);
      res.status(500).json({ error: 'Google authentication failed' });
    }
  });

  return router;
};
