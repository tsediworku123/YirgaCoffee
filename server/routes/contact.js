const express = require('express');

module.exports = function(db) {
  const router = express.Router();

  // Submit contact form
  router.post('/', (req, res) => {
    try {
      const { name, email, company, interest, message } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required' });
      }
      db.prepare('INSERT INTO contact_messages (name, email, company, interest, message) VALUES (?, ?, ?, ?, ?)')
        .run(name, email, company || '', interest || '', message);
      res.status(201).json({ message: 'Message sent successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Subscribe to newsletter
  router.post('/newsletter', (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email required' });
      db.prepare('INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)').run(email);
      res.status(201).json({ message: 'Subscribed successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to subscribe' });
    }
  });

  return router;
};
