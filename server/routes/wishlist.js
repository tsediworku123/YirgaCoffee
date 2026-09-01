const express = require('express');
const { authenticate } = require('../middleware/auth');

module.exports = function(db) {
  const router = express.Router();
  router.use(authenticate);

  // Get wishlist
  router.get('/', (req, res) => {
    try {
      const items = db.prepare(`
        SELECT w.id as wishlist_id, p.*
        FROM wishlist w
        JOIN products p ON w.product_id = p.id
        WHERE w.user_id = ? AND p.active = 1
        ORDER BY w.created_at DESC
      `).all(req.user.id);
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
  });

  // Add to wishlist
  router.post('/add', (req, res) => {
    try {
      const { product_id } = req.body;
      if (!product_id) return res.status(400).json({ error: 'Product ID required' });
      const product = db.prepare('SELECT id FROM products WHERE id = ? AND active = 1').get(product_id);
      if (!product) return res.status(404).json({ error: 'Product not found' });

      const existing = db.prepare('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?').get(req.user.id, product_id);
      if (existing) {
        db.prepare('DELETE FROM wishlist WHERE id = ?').run(existing.id);
        return res.json({ wishlisted: false, message: 'Removed from wishlist' });
      }

      db.prepare('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)').run(req.user.id, product_id);
      res.json({ wishlisted: true, message: 'Added to wishlist' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update wishlist' });
    }
  });

  // Check if product is wishlisted
  router.get('/check/:productId', (req, res) => {
    try {
      const item = db.prepare('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?').get(req.user.id, req.params.productId);
      res.json({ wishlisted: !!item });
    } catch (err) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // Remove from wishlist
  router.delete('/:productId', (req, res) => {
    try {
      db.prepare('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?').run(req.user.id, req.params.productId);
      res.json({ message: 'Removed from wishlist' });
    } catch (err) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  return router;
};
