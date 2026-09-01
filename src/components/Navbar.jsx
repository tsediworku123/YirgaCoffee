import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { Sun, Moon, ShoppingBag, Menu, X, User, Heart } from 'lucide-react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { dark, toggle } = useTheme()
  const { itemCount, setOpen } = useCart()
  const { user } = useAuth()
  const location = useLocation()
  const isHome = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location])

  const navBg = scrolled || !isHome ? 'navbar--solid' : ''

  const links = [
    { to: '/', label: 'Home' },
    { to: '/shop', label: 'Shop' },
    { to: '/subscriptions', label: 'Subscribe' },
    { to: '/about', label: 'Our Story' },
    { to: '/contact', label: 'Contact' },
  ]

  return (
    <header className={`navbar ${navBg}`}>
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
            <circle cx="18" cy="18" r="17" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10 26c0-8 3.5-14 8-17.5C22.5 12 26 18 26 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M18 8.5v3M18 27.5v0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span className="logo-wordmark">
            <span className="logo-yirga">Yirga</span>
            <span className="logo-coffee">Coffee</span>
          </span>
        </Link>

        <nav className={`nav-links ${menuOpen ? 'nav-links--open' : ''}`}>
          {links.map(l => (
            <Link key={l.to} to={l.to} className={`nav-link ${location.pathname === l.to ? 'nav-link--active' : ''}`}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <button onClick={toggle} className="nav-icon-btn" aria-label="Toggle theme">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {user && (
            <Link to="/wishlist" className="nav-icon-btn" aria-label="Wishlist">
              <Heart size={18} />
            </Link>
          )}
          <button onClick={() => setOpen(true)} className="nav-icon-btn nav-cart-btn" aria-label="Open cart">
            <ShoppingBag size={18} />
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </button>
          {user ? (
            <Link to={user.role === 'admin' ? '/admin' : '/account'} className="nav-icon-btn" aria-label="Account">
              <User size={18} />
            </Link>
          ) : (
            <Link to="/login" className="nav-link nav-link--cta">Sign In</Link>
          )}
          <button onClick={() => setMenuOpen(m => !m)} className="nav-icon-btn nav-hamburger" aria-label="Toggle menu">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  )
}
