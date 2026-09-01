import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = async (e) => {
    e.preventDefault()
    if (!email) return
    try {
      await api.subscribe(email)
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 3000)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="nav-logo footer-logo-link">
              <svg viewBox="0 0 36 36" width="32" height="32" fill="none">
                <circle cx="18" cy="18" r="17" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 26c0-8 3.5-14 8-17.5C22.5 12 26 18 26 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="logo-wordmark">
                <span className="logo-yirga">Yirga</span>
                <span className="logo-coffee">Coffee</span>
              </span>
            </Link>
            <p className="footer-desc">
              From the birthplace of coffee to the world. Premium Ethiopian Arabica
              sourced directly from family farms across the highlands.
            </p>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Explore</h4>
            <ul className="footer-list">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">Our Story</Link></li>
              <li><Link to="/shop">Shop</Link></li>
              <li><Link to="/subscriptions">Subscriptions</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Business</h4>
            <ul className="footer-list">
              <li><Link to="/contact?interest=wholesale">Wholesale</Link></li>
              <li><Link to="/contact?interest=distribution">Distribution</Link></li>
              <li><Link to="/contact?interest=private-label">Private Label</Link></li>
              <li><Link to="/contact?interest=partnerships">Partnerships</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Stay Updated</h4>
            <p className="footer-desc">New harvests, roasting tips, and exclusive offers.</p>
            <form className="footer-form" onSubmit={handleSubscribe}>
              <input type="email" placeholder="Your email address" required value={email} onChange={e => setEmail(e.target.value)} />
              <button type="submit" className="btn btn--sm">{subscribed ? 'Sent' : 'Subscribe'}</button>
            </form>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 Yirga Coffee International B.V. All rights reserved.</p>
          <div className="footer-certs" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link to="/privacy" style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.4)' }}>Privacy</Link>
            <Link to="/terms" style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.4)' }}>Terms</Link>
            <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.3)' }}>SCA Member</span>
            <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.3)' }}>USDA Organic</span>
            <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.3)' }}>Fair Trade</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
