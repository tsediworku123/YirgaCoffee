const express = require('express');
const { authenticate } = require('../middleware/auth');

module.exports = function(db) {
  const router = express.Router();
  router.use(authenticate);

  // Get user's subscriptions
  router.get('/', (req, res) => {
    try {
      const subs = db.prepare(`
        SELECT s.*, p.name as product_name, p.img as product_img, p.price as current_price, p.region
        FROM subscriptions s
        JOIN products p ON s.product_id = p.id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
      `).all(req.user.id);
      res.json(subs);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
  });

  // Create subscription
  router.post('/', (req, res) => {
    try {
      const { product_id, quantity, frequency } = req.body;
      if (!product_id) return res.status(400).json({ error: 'Product is required' });

      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      if (product.stock < (quantity || 1)) return res.status(400).json({ error: 'Insufficient stock' });

      // Calculate subscription discount
      const qty = quantity || 1;
      const tier = db.prepare(
        'SELECT * FROM wholesale_tiers WHERE min_qty <= ? AND (max_qty IS NULL OR max_qty >= ?) ORDER BY min_qty DESC LIMIT 1'
      ).get(qty, qty);
      const baseDiscount = tier ? tier.discount_percent : 0;
      const totalDiscount = Math.min(baseDiscount + 15, 40);
      const pricePerUnit = Math.round(product.price * (1 - totalDiscount / 100) * 100) / 100;

      const freqDays = { weekly: 7, biweekly: 14, monthly: 30, quarterly: 90 };
      const freq = frequency || 'monthly';
      const nextDelivery = new Date(Date.now() + (freqDays[freq] || 30) * 86400000);

      const result = db.prepare(`
        INSERT INTO subscriptions (user_id, product_id, quantity, frequency, price_per_unit, discount_percent, next_delivery)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(req.user.id, product_id, qty, freq, pricePerUnit, totalDiscount, nextDelivery.toISOString().split('T')[0]);

      const sub = db.prepare(`
        SELECT s.*, p.name as product_name, p.img as product_img
        FROM subscriptions s JOIN products p ON s.product_id = p.id
        WHERE s.id = ?
      `).get(result.lastInsertRowid);

      res.status(201).json(sub);
    } catch (err) {
      console.error('Create subscription error:', err);
      res.status(500).json({ error: 'Failed to create subscription' });
    }
  });

  // Pause/Resume subscription
  router.put('/:id', (req, res) => {
    try {
      const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?')
        .get(req.params.id, req.user.id);
      if (!sub) return res.status(404).json({ error: 'Subscription not found' });

      const { status, quantity, frequency } = req.body;
      const updates = [];
      const params = [];

      if (status && ['active', 'paused', 'cancelled'].includes(status)) {
        updates.push('status = ?');
        params.push(status);
      }
      if (quantity && quantity > 0) {
        updates.push('quantity = ?');
        params.push(quantity);
      }
      if (frequency && ['weekly', 'biweekly', 'monthly', 'quarterly'].includes(frequency)) {
        const freqDays = { weekly: 7, biweekly: 14, monthly: 30, quarterly: 90 };
        const nextDelivery = new Date(Date.now() + freqDays[frequency] * 86400000);
        updates.push('frequency = ?, next_delivery = ?');
        params.push(frequency, nextDelivery.toISOString().split('T')[0]);
      }

      if (updates.length === 0) return res.status(400).json({ error: 'No valid updates provided' });

      params.push(req.params.id);
      db.prepare(`UPDATE subscriptions SET ${updates.join(', ')} WHERE id = ?`).run(...params);

      const updated = db.prepare(`
        SELECT s.*, p.name as product_name, p.img as product_img
        FROM subscriptions s JOIN products p ON s.product_id = p.id
        WHERE s.id = ?
      `).get(req.params.id);

      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update subscription' });
    }
  });

  // Cancel and delete subscription
  router.delete('/:id', (req, res) => {
    try {
      const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?')
        .get(req.params.id, req.user.id);
      if (!sub) return res.status(404).json({ error: 'Subscription not found' });

      db.prepare('DELETE FROM subscriptions WHERE id = ?').run(req.params.id);
      res.json({ message: 'Subscription cancelled' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  });

  return router;
};
