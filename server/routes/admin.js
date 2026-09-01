const express = require('express');
const path = require('path');
const multer = require('multer');
const { authenticate, requireAdmin } = require('../middleware/auth');

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', '..', 'public', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  }
});

module.exports = function(db) {
  const router = express.Router();
  router.use(authenticate, requireAdmin);

  // Dashboard stats
  router.get('/stats', (req, res) => {
    try {
      const totalUsers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'customer'").get().c;
      const totalProducts = db.prepare('SELECT COUNT(*) as c FROM products WHERE active = 1').get().c;
      const totalOrders = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
      const totalRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as t FROM orders WHERE payment_status = 'paid'").get().t;
      const pendingOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'pending'").get().c;
      const recentOrders = db.prepare('SELECT o.*, u.name as customer_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 10').all();
      const lowStock = db.prepare('SELECT * FROM products WHERE stock < 20 AND active = 1 ORDER BY stock ASC').all();
      const unreadMessages = db.prepare('SELECT COUNT(*) as c FROM contact_messages WHERE read = 0').get().c;

      res.json({
        totalUsers, totalProducts, totalOrders, totalRevenue,
        pendingOrders, recentOrders, lowStock, unreadMessages
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // ---- Products ----
  router.get('/products', (req, res) => {
    try {
      const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
      res.json(products);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  router.post('/products', (req, res) => {
    try {
      const { name, slug, description, short_desc, price, region, origin, altitude, roast_level, process, size, weight_grams, stock, badge, img, tasting_notes, featured } = req.body;
      if (!name || !price) return res.status(400).json({ error: 'Name and price required' });
      const result = db.prepare(`
        INSERT INTO products (name, slug, description, short_desc, price, region, origin, altitude, roast_level, process, size, weight_grams, stock, badge, img, tasting_notes, featured)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(name, slug || name.toLowerCase().replace(/\s+/g, '-'), description || '', short_desc || '', price,
        region || '', origin || '', altitude || '', roast_level || 'medium', process || '',
        size || '250g', weight_grams || 250, stock || 100, badge || '', img || '', tasting_notes || '', featured || 0);
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(product);
    } catch (err) {
      console.error('Product create error:', err);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  router.put('/products/:id', (req, res) => {
    try {
      const fields = ['name', 'slug', 'description', 'short_desc', 'price', 'region', 'origin', 'altitude', 'roast_level', 'process', 'size', 'weight_grams', 'stock', 'badge', 'img', 'tasting_notes', 'featured', 'active'];
      const updates = [];
      const values = [];
      for (const f of fields) {
        if (req.body[f] !== undefined) {
          updates.push(`${f} = ?`);
          values.push(req.body[f]);
        }
      }
      if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
      values.push(req.params.id);
      db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
      res.json(product);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  router.delete('/products/:id', (req, res) => {
    try {
      db.prepare('UPDATE products SET active = 0 WHERE id = ?').run(req.params.id);
      res.json({ message: 'Product deactivated' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  // ---- Image Upload ----
  router.post('/upload', upload.single('image'), (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No image provided' });
      const url = `/uploads/${req.file.filename}`;
      res.json({ url });
    } catch (err) {
      res.status(500).json({ error: 'Upload failed' });
    }
  });

  // ---- Orders ----
  router.get('/orders', (req, res) => {
    try {
      const { status } = req.query;
      let query = 'SELECT o.*, u.name as customer_name, u.email as customer_email FROM orders o JOIN users u ON o.user_id = u.id';
      const params = [];
      if (status && status !== 'all') {
        query += ' WHERE o.status = ?';
        params.push(status);
      }
      query += ' ORDER BY o.created_at DESC';
      const orders = db.prepare(query).all(...params);
      for (const order of orders) {
        order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      }
      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  router.put('/orders/:id/status', (req, res) => {
    try {
      const { status, tracking_number } = req.body;
      const valid = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
      if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
      const updates = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
      const params = [status];
      if (tracking_number) {
        updates.push('tracking_number = ?');
        params.push(tracking_number);
      }
      params.push(req.params.id);
      db.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
      order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      res.json(order);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update order' });
    }
  });

  // ---- Users ----
  router.get('/users', (req, res) => {
    try {
      const users = db.prepare('SELECT id, name, email, role, phone, company, created_at FROM users ORDER BY created_at DESC').all();
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // ---- Contact Messages ----
  router.get('/messages', (req, res) => {
    try {
      const messages = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
      res.json(messages);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  router.put('/messages/:id/read', (req, res) => {
    try {
      db.prepare('UPDATE contact_messages SET read = 1 WHERE id = ?').run(req.params.id);
      res.json({ message: 'Marked as read' });
    } catch (err) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // ---- Reviews ----
  router.get('/reviews', (req, res) => {
    try {
      const reviews = db.prepare(`
        SELECT r.*, u.name as author_name, p.name as product_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN products p ON r.product_id = p.id
        ORDER BY r.created_at DESC
      `).all();
      res.json(reviews);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  });

  router.put('/reviews/:id/approve', (req, res) => {
    try {
      db.prepare('UPDATE reviews SET approved = ? WHERE id = ?').run(req.body.approved ? 1 : 0, req.params.id);
      res.json({ message: 'Review updated' });
    } catch (err) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  return router;
};
