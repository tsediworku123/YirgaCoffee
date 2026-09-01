import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

function FadeIn({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <motion.div ref={ref} className={className} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay }}>
      {children}
    </motion.div>
  )
}

export default function Privacy() {
  return (
    <section className="section" style={{ paddingTop: 140 }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <FadeIn>
          <span className="section-label">Legal</span>
          <h1 className="section-title" style={{ marginBottom: 8 }}>Privacy Policy</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '.9rem', marginBottom: 40 }}>Last updated: August 31, 2026</p>
        </FadeIn>

        <FadeIn delay={0.05}>
          <div className="privacy-content">
            <h2>1. Information We Collect</h2>
            <p>When you create an account, place an order, or contact us, we collect personal information including your name, email address, shipping address, phone number, and payment information. We also collect browsing data such as pages viewed and products interacted with to improve our service.</p>

            <h2>2. How We Use Your Information</h2>
            <p>Your information is used to process orders, deliver products, communicate about your purchases, send order confirmations and shipping updates, improve our website and services, and send marketing communications (only with your consent). We do not sell your personal data to third parties.</p>

            <h2>3. Payment Processing</h2>
            <p>All payment transactions are processed through Stripe, a PCI Level 1 certified payment processor. We do not store credit card numbers on our servers. Stripe handles all card data securely in compliance with the highest industry standards.</p>

            <h2>4. Data Security</h2>
            <p>We implement industry-standard security measures including encrypted data transmission (TLS/SSL), secure password hashing (bcrypt), role-based access controls, and regular security audits. While no method of transmission is 100% secure, we take every reasonable precaution to protect your data.</p>

            <h2>5. Cookies and Tracking</h2>
            <p>We use essential cookies for authentication and session management. We may also use analytics cookies to understand how visitors interact with our website. You can control cookie preferences through your browser settings or our cookie consent banner.</p>

            <h2>6. Third-Party Services</h2>
            <p>We use the following third-party services: Stripe for payment processing, Unsplash for product imagery, and our hosting provider for infrastructure. Each service has its own privacy policy governing data handling.</p>

            <h2>7. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. You can manage your account information through your profile page. To request complete data deletion, contact us at privacy@yirgacoffee.com. We will respond within 30 days.</p>

            <h2>8. International Data Transfers</h2>
            <p>As we operate internationally, your data may be processed in countries other than your own. We ensure appropriate safeguards are in place for all cross-border data transfers in compliance with applicable data protection laws.</p>

            <h2>9. Data Retention</h2>
            <p>We retain your account information for as long as your account is active. Order data is retained for a minimum of 7 years for tax and legal compliance. You may request deletion of your account at any time by contacting our support team.</p>

            <h2>10. Children's Privacy</h2>
            <p>Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from minors. If you believe a minor has provided us with personal data, please contact us immediately.</p>

            <h2>11. Changes to This Policy</h2>
            <p>We may update this privacy policy from time to time. We will notify registered users of any material changes via email. Continued use of our services after changes are posted constitutes acceptance of the updated policy.</p>

            <h2>12. Contact Us</h2>
            <p>For any questions about this privacy policy or our data practices, please contact us at:</p>
            <p><strong>Yirga Coffee International B.V.</strong><br />
            Europaweg 830, 3199 LD Rotterdam, Netherlands<br />
            privacy@yirgacoffee.com<br />
            +31 10 234 5678</p>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
