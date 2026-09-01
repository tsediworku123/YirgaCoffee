import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: 'By accessing or using the Yirga Coffee website and services, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not access our website or purchase our products. These terms apply to all visitors, customers, and users of the site.'
  },
  {
    title: '2. Products and Pricing',
    content: 'All coffee products are described as accurately as possible on our website. Colors and appearance may vary slightly from what you see on screen due to monitor differences. Prices are listed in US Dollars and are subject to change without notice. We reserve the right to limit order quantities and to refuse any order. Wholesale pricing tiers apply based on order volume as outlined on our wholesale page.'
  },
  {
    title: '3. Orders and Payment',
    content: 'By placing an order, you represent that all information provided is accurate and complete. We accept major credit cards through our secure Stripe payment processor. Payment is collected at the time of order placement. All orders are subject to product availability. We reserve the right to cancel any order that appears fraudulent or that we cannot fulfill.'
  },
  {
    title: '4. Shipping and Delivery',
    content: 'We ship to over 30 countries worldwide. Standard shipping takes 5-12 business days depending on destination. Free shipping applies to orders over $50. International customers are responsible for any customs duties, taxes, or import fees imposed by their country. We are not responsible for delays caused by customs processing or carrier issues.'
  },
  {
    title: '5. Returns and Refunds',
    content: 'Due to the perishable nature of coffee, we do not accept returns on opened products. If your order arrives damaged or is incorrect, contact us within 7 days of delivery with your order number and photos of the issue. We will arrange a replacement or full refund at our discretion. Unopened, sealed products may be returned within 30 days of purchase at the customer\'s expense.'
  },
  {
    title: '6. Subscriptions',
    content: 'Coffee subscriptions provide recurring deliveries at a discounted rate. You may pause, modify, or cancel your subscription at any time from your account page. Cancellations must be made at least 48 hours before the next scheduled delivery. Subscription discounts range from 15% to 40% off regular pricing depending on quantity and frequency.'
  },
  {
    title: '7. Wholesale and B2B',
    content: 'Wholesale pricing is available for qualified businesses including cafes, roasters, distributors, and retailers. Minimum order quantities apply. Wholesale customers must provide a valid business registration or tax ID. We reserve the right to verify business credentials before approving wholesale accounts. Volume discounts range from 10% to 32% off retail pricing.'
  },
  {
    title: '8. Intellectual Property',
    content: 'All content on this website, including text, images, logos, graphics, and software, is the property of Yirga Coffee International B.V. and is protected by international copyright laws. You may not reproduce, distribute, or create derivative works without our written permission. Product images are used with permission or under license.'
  },
  {
    title: '9. Privacy',
    content: 'Your privacy is important to us. We collect only the information necessary to process your orders and provide our services. We do not sell or share personal data with third parties for marketing purposes. For complete details, please review our Privacy Policy. By using our services, you consent to our data practices as described therein.'
  },
  {
    title: '10. Limitation of Liability',
    content: 'Yirga Coffee shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services. Our total liability shall not exceed the amount paid for the specific product or service in question. Coffee is a natural agricultural product, and flavor profiles may vary between harvests.'
  },
  {
    title: '11. Governing Law',
    content: 'These Terms of Service are governed by the laws of the Netherlands. Any disputes shall be resolved in the courts of Amsterdam. For international customers, local consumer protection laws may apply in addition to these terms.'
  },
  {
    title: '12. Changes to Terms',
    content: 'We reserve the right to modify these terms at any time. Changes will be posted on this page with an updated revision date. Your continued use of the website after changes constitutes acceptance of the revised terms. We encourage you to review these terms periodically.'
  }
]

export default function Terms() {
  return (
    <section className="section" style={{ paddingTop: 120 }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="section-label">Legal</span>
          <h1 className="section-title" style={{ marginBottom: 12 }}>Terms of <em>Service</em></h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: '.9rem' }}>Last updated: September 2026</p>
          <p style={{ color: 'var(--text-muted)', marginBottom: 40, lineHeight: 1.7 }}>
            Please read these terms carefully before using our website or purchasing our products.
            These terms constitute a legally binding agreement between you and Yirga Coffee International B.V.
          </p>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {sections.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <h3 style={{ fontFamily: 'var(--ff-heading)', fontSize: '1.15rem', marginBottom: 10, color: 'var(--brown-700)' }}>{s.title}</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '.95rem' }}>{s.content}</p>
            </motion.div>
          ))}
        </div>

        <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '.9rem', marginBottom: 16 }}>
            Questions about these terms? Contact our legal team.
          </p>
          <Link to="/contact" className="btn btn--primary btn--sm">Contact Us</Link>
        </div>
      </div>
    </section>
  )
}
