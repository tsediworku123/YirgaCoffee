const express = require('express');
const { authenticate } = require('../middleware/auth');

module.exports = function(db, stripe) {
  const router = express.Router();
  router.use(authenticate);

  // Create Stripe payment intent
  router.post('/create-payment', async (req, res) => {
    try {
      const items = db.prepare(`
        SELECT ci.quantity, p.price, p.name
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
      `).all(req.user.id);

      if (items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

      const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const shipping = subtotal >= 50 ? 0 : 9.99;
      const tax = Math.round(subtotal * 0.08 * 100) / 100;
      const total = Math.round((subtotal + shipping + tax) * 100) / 100;

      if (stripe) {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(total * 100),
          currency: 'usd',
          metadata: { userId: req.user.id.toString() },
          automatic_payment_methods: { enabled: true }
        });
        res.json({ clientSecret: paymentIntent.client_secret, amount: total });
      } else {
        res.json({ clientSecret: null, amount: total, stripeConfigured: false });
      }
    } catch (err) {
      console.error('Payment intent error:', err);
      res.status(500).json({ error: 'Failed to create payment' });
    }
  });

  // Create order (after payment confirmation)
  router.post('/', async (req, res) => {
    const transaction = db.transaction(() => {
      try {
        const { shipping_name, shipping_email, shipping_address, shipping_city, shipping_country, shipping_postal, shipping_phone, payment_intent_id, notes } = req.body;

        const cartItems = db.prepare(`
          SELECT ci.*, p.name, p.price, p.img, p.stock
          FROM cart_items ci
          JOIN products p ON ci.product_id = p.id
          WHERE ci.user_id = ?
        `).all(req.user.id);

        if (cartItems.length === 0) throw new Error('Cart is empty');

        // Check stock
        for (const item of cartItems) {
          if (item.stock < item.quantity) throw new Error(`Insufficient stock for ${item.name}`);
        }

        const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const shipping_cost = subtotal >= 50 ? 0 : 9.99;
        const tax = Math.round(subtotal * 0.08 * 100) / 100;
        const total = Math.round((subtotal + shipping_cost + tax) * 100) / 100;

        // Determine payment status
        let paymentStatus = 'unpaid';
        let paymentId = payment_intent_id || '';
        
        if (payment_intent_id && payment_intent_id.startsWith('pi_')) {
          // Stripe payment intent - already confirmed on frontend
          paymentStatus = 'paid';
        } else if (payment_intent_id && payment_intent_id.startsWith('chapa_')) {
          // Chapa payment - tx_ref passed, mark as pending until verified
          paymentId = payment_intent_id.replace('chapa_', '');
          paymentStatus = 'unpaid';
          
          // Check if already verified
          const chapaTx = db.prepare('SELECT status FROM chapa_transactions WHERE tx_ref = ?').get(paymentId);
          if (chapaTx && chapaTx.status === 'verified') {
            paymentStatus = 'paid';
          }
        } else if (payment_intent_id && payment_intent_id.startsWith('eth_')) {
          // Bank transfer or other manual method - pending until admin confirms
          paymentStatus = 'unpaid';
        }

        // Create order
        const orderResult = db.prepare(`
          INSERT INTO orders (user_id, subtotal, shipping_cost, tax, total, payment_intent_id, payment_status,
            shipping_name, shipping_email, shipping_address, shipping_city, shipping_country, shipping_postal, shipping_phone, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          req.user.id, subtotal, shipping_cost, tax, total,
          paymentId, paymentStatus,
          shipping_name || '', shipping_email || '', shipping_address || '',
          shipping_city || '', shipping_country || '', shipping_postal || '',
          shipping_phone || '', notes || ''
        );

        const orderId = orderResult.lastInsertRowid;

        // Create order items and update stock
        const insertItem = db.prepare(`
          INSERT INTO order_items (order_id, product_id, product_name, product_img, quantity, price)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

        for (const item of cartItems) {
          insertItem.run(orderId, item.product_id, item.name, item.img, item.quantity, item.price);
          updateStock.run(item.quantity, item.product_id);
        }

        // Clear cart
        db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);

        // Return order with items
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
        order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

        return order;
      } catch (err) {
        throw err;
      }
    });

    try {
      const order = transaction();
      res.status(201).json(order);
    } catch (err) {
      console.error('Order creation error:', err);
      res.status(400).json({ error: err.message || 'Failed to create order' });
    }
  });

  // List user's orders
  router.get('/', (req, res) => {
    try {
      const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC')
        .all(req.user.id);

      for (const order of orders) {
        order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      }

      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  // Get single order
  router.get('/:id', (req, res) => {
    try {
      const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
        .get(req.params.id, req.user.id);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      res.json(order);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  });

  return router;
};
