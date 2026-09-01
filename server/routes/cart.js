const express = require('express');
const { authenticate } = require('../middleware/auth');

module.exports = function(db) {
  const router = express.Router();

  // All cart routes require authentication
  router.use(authenticate);

  // Get cart
  router.get('/', (req, res) => {
    try {
      const items = db.prepare(`
        SELECT ci.id, ci.quantity, ci.product_id,
               p.name, p.price, p.img, p.size, p.region, p.stock, p.slug
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
        ORDER BY ci.created_at DESC
      `).all(req.user.id);

      const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const shipping = subtotal >= 50 ? 0 : 9.99;
      const tax = Math.round(subtotal * 0.08 * 100) / 100;
      const total = Math.round((subtotal + shipping + tax) * 100) / 100;

      res.json({ items, subtotal, shipping, tax, total, itemCount: items.reduce((s, i) => s + i.quantity, 0) });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch cart' });
    }
  });

  // Add to cart
  router.post('/add', (req, res) => {
    try {
      const { product_id, quantity = 1 } = req.body;
      if (!product_id) return res.status(400).json({ error: 'Product ID required' });

      const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(product_id);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      if (product.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });

      const existing = db.prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?')
        .get(req.user.id, product_id);

      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, product.stock);
        db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, existing.id);
      } else {
        db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)')
          .run(req.user.id, product_id, quantity);
      }

      // Return updated cart
      const items = db.prepare(`
        SELECT ci.id, ci.quantity, ci.product_id,
               p.name, p.price, p.img, p.size, p.region, p.stock
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
      `).all(req.user.id);

      const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const shipping = subtotal >= 50 ? 0 : 9.99;
      const tax = Math.round(subtotal * 0.08 * 100) / 100;
      const total = Math.round((subtotal + shipping + tax) * 100) / 100;

      res.json({ items, subtotal, shipping, tax, total, itemCount: items.reduce((s, i) => s + i.quantity, 0) });
    } catch (err) {
      console.error('Cart add error:', err);
      res.status(500).json({ error: 'Failed to add to cart' });
    }
  });

  // Update quantity
  router.put('/:id', (req, res) => {
    try {
      const { quantity } = req.body;
      if (!quantity || quantity < 1) {
        db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
      } else {
        const item = db.prepare(`
          SELECT ci.id, p.stock FROM cart_items ci
          JOIN products p ON ci.product_id = p.id
          WHERE ci.id = ? AND ci.user_id = ?
        `).get(req.params.id, req.user.id);
        if (item) {
          const capped = Math.min(quantity, item.stock);
          db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(capped, req.params.id);
        }
      }

      const items = db.prepare(`
        SELECT ci.id, ci.quantity, ci.product_id,
               p.name, p.price, p.img, p.size, p.region, p.stock
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
      `).all(req.user.id);

      const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const shipping = subtotal >= 50 ? 0 : 9.99;
      const tax = Math.round(subtotal * 0.08 * 100) / 100;
      const total = Math.round((subtotal + shipping + tax) * 100) / 100;

      res.json({ items, subtotal, shipping, tax, total, itemCount: items.reduce((s, i) => s + i.quantity, 0) });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update cart' });
    }
  });

  // Remove from cart
  router.delete('/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);

      const items = db.prepare(`
        SELECT ci.id, ci.quantity, ci.product_id,
               p.name, p.price, p.img, p.size, p.region, p.stock
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
      `).all(req.user.id);

      const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const shipping = subtotal >= 50 ? 0 : 9.99;
      const tax = Math.round(subtotal * 0.08 * 100) / 100;
      const total = Math.round((subtotal + shipping + tax) * 100) / 100;

      res.json({ items, subtotal, shipping, tax, total, itemCount: items.reduce((s, i) => s + i.quantity, 0) });
    } catch (err) {
      res.status(500).json({ error: 'Failed to remove from cart' });
    }
  });

  // Clear cart
  router.delete('/', (req, res) => {
    try {
      db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
      res.json({ items: [], subtotal: 0, shipping: 0, tax: 0, total: 0, itemCount: 0 });
    } catch (err) {
      res.status(500).json({ error: 'Failed to clear cart' });
    }
  });

  return router;
};
