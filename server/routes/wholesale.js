const express = require('express');

module.exports = function(db) {
  const router = express.Router();

  // Get wholesale tiers (public)
  router.get('/tiers', (req, res) => {
    try {
      const tiers = db.prepare('SELECT * FROM wholesale_tiers ORDER BY min_qty ASC').all();
      res.json(tiers);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch tiers' });
    }
  });

  // Calculate wholesale price for a given quantity
  router.post('/calculate', (req, res) => {
    try {
      const { product_id, quantity } = req.body;
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
      if (!product) return res.status(404).json({ error: 'Product not found' });

      const tier = db.prepare(
        'SELECT * FROM wholesale_tiers WHERE min_qty <= ? AND (max_qty IS NULL OR max_qty >= ?) ORDER BY min_qty DESC LIMIT 1'
      ).get(quantity, quantity);

      const discountPercent = tier ? tier.discount_percent : 0;
      const unitPrice = product.price * (1 - discountPercent / 100);
      const totalPrice = unitPrice * quantity;

      res.json({
        product_id,
        quantity,
        original_price: product.price,
        unit_price: Math.round(unitPrice * 100) / 100,
        total_price: Math.round(totalPrice * 100) / 100,
        discount_percent: discountPercent,
        tier_label: tier ? tier.label : 'Retail',
        savings: Math.round((product.price * quantity - totalPrice) * 100) / 100
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to calculate price' });
    }
  });

  return router;
};
