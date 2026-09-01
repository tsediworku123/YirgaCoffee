const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'yirga.db');

function initDatabase() {
  const fs = require('fs');
  const dataDir = path.join(__dirname, '..', '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'customer' CHECK(role IN ('customer','admin')),
      phone TEXT DEFAULT '',
      company TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      short_desc TEXT DEFAULT '',
      price REAL NOT NULL,
      region TEXT NOT NULL,
      origin TEXT DEFAULT '',
      altitude TEXT DEFAULT '',
      roast_level TEXT DEFAULT 'medium',
      process TEXT DEFAULT '',
      size TEXT DEFAULT '250g',
      weight_grams INTEGER DEFAULT 250,
      rating REAL DEFAULT 0,
      reviews_count INTEGER DEFAULT 0,
      stock INTEGER DEFAULT 100,
      img TEXT DEFAULT '',
      badge TEXT DEFAULT '',
      tasting_notes TEXT DEFAULT '',
      featured INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
      subtotal REAL NOT NULL,
      shipping_cost REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      payment_intent_id TEXT DEFAULT '',
      payment_status TEXT DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid','paid','refunded','failed')),
      shipping_name TEXT DEFAULT '',
      shipping_email TEXT DEFAULT '',
      shipping_address TEXT DEFAULT '',
      shipping_city TEXT DEFAULT '',
      shipping_country TEXT DEFAULT '',
      shipping_postal TEXT DEFAULT '',
      shipping_phone TEXT DEFAULT '',
      tracking_number TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      product_img TEXT DEFAULT '',
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      title TEXT DEFAULT '',
      text TEXT DEFAULT '',
      approved INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT DEFAULT '',
      interest TEXT DEFAULT '',
      message TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS wholesale_tiers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      min_qty INTEGER NOT NULL,
      max_qty INTEGER,
      discount_percent REAL NOT NULL,
      label TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      frequency TEXT DEFAULT 'monthly' CHECK(frequency IN ('weekly','biweekly','monthly','quarterly')),
      price_per_unit REAL DEFAULT 0,
      discount_percent REAL DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','paused','cancelled')),
      next_delivery DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS chapa_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tx_ref TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      order_id INTEGER,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'ETB',
      method TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','verified','failed','cancelled')),
      verified_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  return db;
}

function seedProducts(db) {
  const count = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
  if (count > 0) return;

  const products = [
    {
      name: 'Yirgacheffe Light Roast', slug: 'yirgacheffe-light',
      description: 'Widely regarded as the finest coffee-producing region on earth. Grown at extreme altitudes in the Gedeo Zone of southern Ethiopia, these beans deliver explosive floral aromatics — bergamot, jasmine, and lemon blossom dominate the nose, while the palate reveals layers of stone fruit, citrus zest, and a clean, winey finish. Light-roasted to preserve the delicate complexity that makes Yirgacheffe world-famous among specialty roasters.',
      short_desc: 'Bergamot, Citrus, Floral, Jasmine',
      price: 24.99, region: 'yirgacheffe', origin: 'Gedeo Zone, Southern Ethiopia',
      altitude: '1,750-2,200m', roast_level: 'light', process: 'Washed',
      size: '250g', weight_grams: 250, rating: 4.9, reviews_count: 127,
      stock: 150, badge: 'Best Seller',
      img: 'https://images.unsplash.com/photo-1611070966513-d9f94c251948?w=500&q=80',
      tasting_notes: 'Bergamot,Citrus,Floral,Jasmine', featured: 1
    },
    {
      name: 'Yirgacheffe Dark Roast', slug: 'yirgacheffe-dark',
      description: 'A bold, full-bodied expression of Yirgacheffe beans. The dark roast brings out rich chocolate and caramel undertones while maintaining the region\'s signature complexity. Perfect for those who want Yirgacheffe character with deeper, richer body.',
      short_desc: 'Chocolate, Caramel, Bold',
      price: 26.99, region: 'yirgacheffe', origin: 'Gedeo Zone, Southern Ethiopia',
      altitude: '1,750-2,200m', roast_level: 'dark', process: 'Washed',
      size: '250g', weight_grams: 250, rating: 4.8, reviews_count: 89,
      stock: 120, badge: '',
      img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=500&q=80',
      tasting_notes: 'Chocolate,Caramel,Bold,Smoky', featured: 0
    },
    {
      name: 'Sidamo Whole Bean', slug: 'sidamo-whole',
      description: 'One of Ethiopia\'s most diverse coffee regions. Natural-processed Sidamo is famous for its heavy body and intense fruit — think ripe blueberry, blackberry compote, and dark chocolate. The region\'s smallholder farmers hand-sort cherries at altitudes where morning fog rolls through canopy shade trees, producing beans that consistently score 85+ on the SCA scale.',
      short_desc: 'Blueberry, Dark Chocolate, Wine',
      price: 22.99, region: 'sidamo', origin: 'Sidama Region, Southern Ethiopia',
      altitude: '1,500-2,200m', roast_level: 'medium', process: 'Natural',
      size: '250g', weight_grams: 250, rating: 4.9, reviews_count: 203,
      stock: 180, badge: '',
      img: 'https://images.unsplash.com/photo-1524350876685-274059332603?w=500&q=80',
      tasting_notes: 'Blueberry,Chocolate,Spice,Wine', featured: 1
    },
    {
      name: 'Sidamo Espresso Blend', slug: 'sidamo-espresso',
      description: 'Specifically crafted for espresso extraction. A blend of Sidamo beans roasted to a medium-dark profile that delivers a thick, tiger-striped crema with notes of dark chocolate, molasses, and gentle spice. Designed for cafés that demand a rich, complex espresso base.',
      short_desc: 'Dark Chocolate, Molasses, Spicy',
      price: 24.99, region: 'sidamo', origin: 'Sidama Region, Southern Ethiopia',
      altitude: '1,500-2,200m', roast_level: 'medium-dark', process: 'Washed',
      size: '250g', weight_grams: 250, rating: 4.7, reviews_count: 156,
      stock: 95, badge: '',
      img: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=500&q=80',
      tasting_notes: 'Dark Chocolate,Molasses,Spicy,Full-bodied', featured: 0
    },
    {
      name: 'Harrar Longberry', slug: 'harrar-longberry',
      description: 'From the oldest coffee region in the world. The Longberry varietal features an elongated bean shape prized by collectors and specialty roasters. Sun-dried on raised beds under the harsh eastern sun, it delivers intense wine-like acidity, a signature blueberry note, and a peppery finish that lingers. A true connoisseur\'s coffee.',
      short_desc: 'Blueberry, Wine, Peppery Finish',
      price: 27.99, region: 'harrar', origin: 'Harrar, Eastern Ethiopia',
      altitude: '1,500-2,100m', roast_level: 'medium', process: 'Natural',
      size: '250g', weight_grams: 250, rating: 4.8, reviews_count: 94,
      stock: 75, badge: '',
      img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&q=80',
      tasting_notes: 'Blueberry,Wine,Fruity,Spicy', featured: 1
    },
    {
      name: 'Harrar Wild', slug: 'harrar-wild',
      description: 'Wild-harvested from the mountains of Harrar where coffee grows as it has for millennia — uncultivated, untamed, extraordinary. This rare, limited-edition lot delivers an intense fruit-forward cup with layers of dried fruit, warm spice, and bold complexity. Each harvest yields only a small quantity, making it one of the most sought-after coffees in the world.',
      short_desc: 'Dried Fruit, Spice, Bold',
      price: 29.99, region: 'harrar', origin: 'Harrar, Eastern Ethiopia',
      altitude: '1,500-2,100m', roast_level: 'medium', process: 'Natural',
      size: '250g', weight_grams: 250, rating: 4.9, reviews_count: 71,
      stock: 30, badge: 'Limited',
      img: 'https://images.unsplash.com/photo-1442411210769-b95c4632195e?w=500&q=80',
      tasting_notes: 'Dried Fruit,Spice,Bold,Wild', featured: 0
    },
    {
      name: 'Limu Washed', slug: 'limu-washed',
      description: 'Grown in the lush, forested highlands of southwestern Ethiopia under natural canopy shade. The washed process and slow drying on raised beds produce a clean, sweet cup with notes of toasted almond, honey, and milk chocolate, complemented by gentle citrus brightness. The preferred base for premium espresso blends worldwide.',
      short_desc: 'Almond, Honey, Milk Chocolate',
      price: 21.99, region: 'limu', origin: 'Limu Zone, Western Ethiopia',
      altitude: '1,500-1,900m', roast_level: 'medium', process: 'Washed',
      size: '250g', weight_grams: 250, rating: 4.6, reviews_count: 118,
      stock: 140, badge: '',
      img: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&q=80',
      tasting_notes: 'Almond,Honey,Balanced,Smooth', featured: 0
    },
    {
      name: 'Jimma Kaffa Reserve', slug: 'jimma-kaffa',
      description: 'From the Kaffa Biosphere Reserve — the genetic birthplace of all arabica coffee. Wild coffee forests still cover these highlands where researchers first identified the origins of Coffea Arabica. Jimma beans deliver deep chocolatey body and earthy sweetness with notes of raw cocoa, ripe peach, and cedar. For roasters seeking an authentic, full-bodied Ethiopian cup, this is the origin.',
      short_desc: 'Cocoa, Peach, Cedar, Earthy',
      price: 25.99, region: 'jimma', origin: 'Jimma Zone, Southwestern Ethiopia',
      altitude: '1,400-2,000m', roast_level: 'medium', process: 'Natural',
      size: '250g', weight_grams: 250, rating: 4.8, reviews_count: 88,
      stock: 100, badge: 'New',
      img: 'https://images.unsplash.com/photo-1442411210769-b95c4632195e?w=500&q=80',
      tasting_notes: 'Cocoa,Peach,Cedar,Earthy', featured: 1
    },
    {
      name: 'Ethiopian Signature Blend', slug: 'signature-blend',
      description: 'Our master roaster\'s carefully crafted blend combining beans from Yirgacheffe, Sidamo, and Harrar. A harmonious balance of bright Yirgacheffe acidity, rich Sidamo body, and bold Harrar fruit complexity. Roasted medium to showcase each origin while creating a seamless, layered cup.',
      short_desc: 'Balanced, Rich, Aromatic',
      price: 23.99, region: 'blend', origin: 'Multi-Region Blend',
      altitude: '1,500-2,200m', roast_level: 'medium', process: 'Mixed',
      size: '250g', weight_grams: 250, rating: 4.8, reviews_count: 312,
      stock: 200, badge: 'Popular',
      img: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=500&q=80',
      tasting_notes: 'Balanced,Rich,Aromatic,Complex', featured: 1
    },
    {
      name: 'Green Bean Sample Pack', slug: 'green-sample',
      description: 'Experience all five Ethiopian origins with our curated sample pack. Each 100g portion of unroasted green beans — Yirgacheffe, Sidamo, Harrar, Limu, and Jimma — lets you roast at home and discover your favorite. Includes roasting guide with recommended profiles for each origin.',
      short_desc: '5 Origins, Unroasted, Home Roast',
      price: 34.99, region: 'blend', origin: 'Multi-Origin Sampler',
      altitude: '1,400-2,200m', roast_level: 'green', process: 'Mixed',
      size: '5x100g', weight_grams: 500, rating: 4.9, reviews_count: 45,
      stock: 60, badge: '',
      img: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500&q=80',
      tasting_notes: '5 Origins,Unroasted,Home Roast', featured: 0
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO products (name, slug, description, short_desc, price, region, origin, altitude, roast_level, process, size, weight_grams, rating, reviews_count, stock, badge, img, tasting_notes, featured)
    VALUES (@name, @slug, @description, @short_desc, @price, @region, @origin, @altitude, @roast_level, @process, @size, @weight_grams, @rating, @reviews_count, @stock, @badge, @img, @tasting_notes, @featured)
  `);

  const insertMany = db.transaction((items) => {
    for (const item of items) stmt.run(item);
  });

  insertMany(products);

  // Seed wholesale tiers
  const tierCount = db.prepare('SELECT COUNT(*) as c FROM wholesale_tiers').get().c;
  if (tierCount === 0) {
    const insertTier = db.prepare('INSERT INTO wholesale_tiers (min_qty, max_qty, discount_percent, label) VALUES (?, ?, ?, ?)');
    insertTier.run(1, 4, 0, 'Retail');
    insertTier.run(5, 19, 8, 'Small Business');
    insertTier.run(20, 49, 15, 'Wholesale');
    insertTier.run(50, 199, 22, 'Distributor');
    insertTier.run(200, null, 32, 'Large Volume');
  }

  // Create default admin only (no demo customers)
  const adminHash = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`)
    .run('Admin', 'admin@yirgacoffee.com', adminHash, 'admin');

  console.log('Database seeded successfully');
}

module.exports = { initDatabase, seedProducts, DB_PATH };
