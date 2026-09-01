require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const { initDatabase, seedProducts } = require('./db/init');

// Initialize database
const db = initDatabase();
seedProducts(db);

// Initialize Stripe (optional)
let stripe = null;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_replace_with_your_stripe_key') {
  const Stripe = require('stripe');
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  console.log('Stripe initialized');
} else {
  console.log('Stripe not configured - card payments disabled');
}

// Chapa config (v1 API - hosted checkout)
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY || '';
const CHAPA_BASE_URL = process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1';
if (CHAPA_SECRET_KEY) {
  console.log('Chapa initialized - Ethiopian payments enabled');
} else {
  console.log('Chapa not configured - Ethiopian payments disabled');
}

const app = express();
const PORT = 3001;

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Rate limiting (simple in-memory)
const rateLimits = new Map();
function rateLimit(maxRequests = 100, windowMs = 60000) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const record = rateLimits.get(ip) || { count: 0, reset: now + windowMs };
    if (now > record.reset) {
      record.count = 0;
      record.reset = now + windowMs;
    }
    record.count++;
    rateLimits.set(ip, record);
    if (record.count > maxRequests) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    next();
  };
}

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '2mb' }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Request logging
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  }
  next();
});

// API Routes
app.use('/api/auth', rateLimit(30, 60000), require('./routes/auth')(db));
app.use('/api/products', require('./routes/products')(db));
app.use('/api/cart', require('./routes/cart')(db));
app.use('/api/orders', require('./routes/orders')(db, stripe));

// Chapa payment endpoints
app.post('/api/payments/chapa/initialize', require('./middleware/auth').authenticate, async (req, res) => {
  try {
    if (!CHAPA_SECRET_KEY) {
      return res.status(503).json({ error: 'Chapa is not configured. Please add CHAPA_SECRET_KEY to your environment.' });
    }

    const { amount, currency, method, phone, order_id } = req.body;

    // Generate unique transaction reference
    const txRef = `yirga-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Store the pending payment
    db.prepare(`
      INSERT INTO chapa_transactions (tx_ref, user_id, order_id, amount, currency, method, phone, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(txRef, req.user.id, order_id || null, amount, currency || 'ETB', method, phone || '');

    // Initialize Chapa checkout (v1 hosted)
    const callbackUrl = `${req.protocol}://${req.get('host')}/api/payments/chapa/callback`;
    const returnUrl = `${req.protocol}://${req.get('host')}/api/payments/chapa/return?tx_ref=${txRef}`;

    // Chapa v1 API format - no email (causes validation errors)
    const chapaPayload = {
      amount: amount.toString(),
      currency: currency || 'ETB',
      first_name: req.body.first_name || 'Customer',
      last_name: req.body.last_name || 'Yirga',
      tx_ref: txRef,
      callback_url: callbackUrl,
      return_url: returnUrl,
      customization: {
        title: 'Yirga Coffee',
        description: order_id ? `Payment for order ${order_id}` : 'Yirga Coffee Payment',
      },
    };

    // Format phone number for Chapa (remove + and spaces)
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      chapaPayload.phone_number = cleanPhone;
    }

    console.log('[CHAPA] Initializing payment:', txRef);

    const response = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chapaPayload),
    });

    const data = await response.json();
    console.log('[CHAPA] Response:', data.status);

    if (data.status === 'success' && data.data && data.data.checkout_url) {
      res.json({ checkout_url: data.data.checkout_url, tx_ref: txRef });
    } else {
      console.error('[CHAPA] Initialize error:', data);
      res.status(400).json({ error: data.message || 'Failed to initialize payment' });
    }
  } catch (err) {
    console.error('[CHAPA] Initialize error:', err);
    res.status(500).json({ error: 'Failed to initialize Chapa payment' });
  }
});

// Chapa callback (webhook) - called by Chapa after payment
app.post('/api/payments/chapa/callback', async (req, res) => {
  try {
    const { tx_ref, status } = req.body;
    console.log(`[CHAPA] Callback: ${tx_ref} → ${status}`);

    if (tx_ref && status === 'success') {
      // Verify the transaction
      const verifyRes = await fetch(`${CHAPA_BASE_URL}/transaction/verify/${tx_ref}`, {
        headers: { 'Authorization': `Bearer ${CHAPA_SECRET_KEY}` },
      });
      const verifyData = await verifyRes.json();

      if (verifyData.status === 'success') {
        db.prepare(`UPDATE chapa_transactions SET status = 'verified', verified_at = CURRENT_TIMESTAMP WHERE tx_ref = ?`).run(tx_ref);

        // If linked to an order, mark it as paid
        const tx = db.prepare('SELECT order_id FROM chapa_transactions WHERE tx_ref = ?').get(tx_ref);
        if (tx && tx.order_id) {
          db.prepare(`UPDATE orders SET payment_status = 'paid', status = 'confirmed' WHERE id = ?`).run(tx.order_id);
        }
        console.log(`[CHAPA] Payment verified: ${tx_ref}`);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[CHAPA] Callback error:', err);
    res.status(500).json({ error: 'Callback processing failed' });
  }
});

// Chapa return page - redirects user back after payment
app.get('/api/payments/chapa/return', async (req, res) => {
  const { tx_ref } = req.query;
  if (tx_ref) {
    try {
      // Verify transaction
      const verifyRes = await fetch(`${CHAPA_BASE_URL}/transaction/verify/${tx_ref}`, {
        headers: { 'Authorization': `Bearer ${CHAPA_SECRET_KEY}` },
      });
      const verifyData = await verifyRes.json();
      console.log('[CHAPA] Return verify:', verifyData.status);

      if (verifyData.status === 'success') {
        db.prepare(`UPDATE chapa_transactions SET status = 'verified', verified_at = CURRENT_TIMESTAMP WHERE tx_ref = ?`).run(tx_ref);
        const tx = db.prepare('SELECT order_id FROM chapa_transactions WHERE tx_ref = ?').get(tx_ref);
        if (tx && tx.order_id) {
          db.prepare(`UPDATE orders SET payment_status = 'paid', status = 'confirmed' WHERE id = ?`).run(tx.order_id);
        }
      }
    } catch (err) {
      console.error('[CHAPA] Return verification error:', err);
    }
  }
  // Redirect back to the app
  res.redirect('/#/checkout?payment=chapa&tx_ref=' + (tx_ref || ''));
});

// Chapa payment status check endpoint
app.get('/api/payments/chapa/status/:tx_ref', require('./middleware/auth').authenticate, async (req, res) => {
  try {
    const tx = db.prepare('SELECT * FROM chapa_transactions WHERE tx_ref = ? AND user_id = ?').get(req.params.tx_ref, req.user.id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    if (tx.status === 'pending') {
      // Verify with Chapa
      const verifyRes = await fetch(`${CHAPA_BASE_URL}/transaction/verify/${tx.tx_ref}`, {
        headers: { 'Authorization': `Bearer ${CHAPA_SECRET_KEY}` },
      });
      const verifyData = await verifyRes.json();

      if (verifyData.status === 'success') {
        db.prepare(`UPDATE chapa_transactions SET status = 'verified', verified_at = CURRENT_TIMESTAMP WHERE tx_ref = ?`).run(tx.tx_ref);
        if (tx.order_id) {
          db.prepare(`UPDATE orders SET payment_status = 'paid', status = 'confirmed' WHERE id = ?`).run(tx.order_id);
        }
        tx.status = 'verified';
      }
    }

    res.json(tx);
  } catch (err) {
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});
app.use('/api/wishlist', require('./routes/wishlist')(db));
app.use('/api/admin', require('./routes/admin')(db));
app.use('/api/contact', require('./routes/contact')(db));
app.use('/api/wholesale', require('./routes/wholesale')(db));
app.use('/api/subscriptions', require('./routes/subscriptions')(db));

// Email notification endpoints (SendGrid/Mailgun ready)
app.post('/api/email/order-confirmation', (req, res) => {
  const { orderId, email, items, total } = req.body;

  // In production, replace with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({ to: email, from: 'orders@yirgacoffee.com', subject: `Order #${orderId} Confirmed`, html: ... });

  console.log(`[EMAIL] Order confirmation → ${email} | Order #${orderId} | $${total}`);
  res.json({ sent: true, mode: 'log' });
});

app.post('/api/email/welcome', (req, res) => {
  const { email, name } = req.body;
  console.log(`[EMAIL] Welcome → ${name} <${email}>`);
  res.json({ sent: true, mode: 'log' });
});

app.post('/api/email/shipping-update', (req, res) => {
  const { orderId, email, trackingNumber, status } = req.body;
  console.log(`[EMAIL] Shipping update → ${email} | Order #${orderId} | ${status} | Tracking: ${trackingNumber}`);
  res.json({ sent: true, mode: 'log' });
});

app.post('/api/email/subscription-renewal', (req, res) => {
  const { email, productName, nextDelivery } = req.body;
  console.log(`[EMAIL] Subscription renewal → ${email} | ${productName} | Next: ${nextDelivery}`);
  res.json({ sent: true, mode: 'log' });
});

// Stripe webhook (if configured)
if (stripe) {
  app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    try {
      const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      if (event.type === 'payment_intent.succeeded') {
        const pi = event.data.object;
        db.prepare("UPDATE orders SET payment_status = 'paid', status = 'confirmed' WHERE payment_intent_id = ?")
          .run(pi.id);
        console.log(`[STRIPE] Payment confirmed for ${pi.id}`);
      }
      if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object;
        console.log(`[STRIPE] Subscription payment: ${invoice.subscription}`);
      }
      res.json({ received: true });
    } catch (err) {
      console.error('[STRIPE] Webhook error:', err.message);
      res.status(400).json({ error: 'Webhook error' });
    }
  });
}

// Static files for email templates (unsubscribe pages etc.)
const staticDir = path.join(__dirname, '..', 'public');
if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
}

// Serve frontend in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'File too large' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Yirga Coffee API running on http://localhost:${PORT}`);
  console.log(`Database: ${path.join(__dirname, '..', 'data', 'yirga.db')}`);
});
