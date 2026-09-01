const express = require('express');
const { optionalAuth } = require('../middleware/auth');

module.exports = function(db) {
  const router = express.Router();

  // Get all products (with search, filter, pagination)
  router.get('/', (req, res) => {
    try {
      const { search, region, roast, sort, page = 1, limit = 20, featured } = req.query;
      let query = 'SELECT * FROM products WHERE active = 1';
      const params = [];

      if (search) {
        query += ' AND (name LIKE ? OR description LIKE ? OR tasting_notes LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s);
      }
      if (region && region !== 'all') {
        query += ' AND region = ?';
        params.push(region);
      }
      if (roast) {
        query += ' AND roast_level = ?';
        params.push(roast);
      }
      if (featured === '1') {
        query += ' AND featured = 1';
      }

      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
      const total = db.prepare(countQuery).get(...params).total;

      if (sort === 'price_asc') query += ' ORDER BY price ASC';
      else if (sort === 'price_desc') query += ' ORDER BY price DESC';
      else if (sort === 'rating') query += ' ORDER BY rating DESC';
      else if (sort === 'newest') query += ' ORDER BY created_at DESC';
      else query += ' ORDER BY featured DESC, rating DESC';

      const offset = (parseInt(page) - 1) * parseInt(limit);
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const products = db.prepare(query).all(...params);
      res.json({ products, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    } catch (err) {
      console.error('Products list error:', err);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  // Get single product
  router.get('/:id', (req, res) => {
    try {
      const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      res.json(product);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  });

  // Get product reviews
  router.get('/:id/reviews', (req, res) => {
    try {
      const reviews = db.prepare(`
        SELECT r.*, u.name as author_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.product_id = ? AND r.approved = 1
        ORDER BY r.created_at DESC
      `).all(req.params.id);
      res.json(reviews);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  });

  // Add review
  router.post('/:id/reviews', optionalAuth, (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Login required to review' });
      const { rating, title, text } = req.body;
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be 1-5' });
      }

      const existing = db.prepare('SELECT id FROM reviews WHERE user_id = ? AND product_id = ?')
        .get(req.user.id, req.params.id);
      if (existing) {
        return res.status(409).json({ error: 'You already reviewed this product' });
      }

      db.prepare('INSERT INTO reviews (user_id, product_id, rating, title, text) VALUES (?, ?, ?, ?, ?)')
        .run(req.user.id, req.params.id, rating, title || '', text || '');

      // Update product rating
      const stats = db.prepare('SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE product_id = ? AND approved = 1')
        .get(req.params.id);
      db.prepare('UPDATE products SET rating = ?, reviews_count = ? WHERE id = ?')
        .run(Math.round(stats.avg_rating * 10) / 10, stats.count, req.params.id);

      res.status(201).json({ message: 'Review submitted' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to submit review' });
    }
  });

  return router;
};
