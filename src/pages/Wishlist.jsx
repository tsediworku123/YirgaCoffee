import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Star, ShoppingBag, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { api } from '../api'
import CartSidebar from '../components/CartSidebar'

export default function Wishlist() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [addedId, setAddedId] = useState(null)
  const { user } = useAuth()
  const { addItem } = useCart()

  useEffect(() => {
    if (!user) { setLoading(false); return }
    api.getWishlist()
      .then(data => setItems(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const handleRemove = async (productId) => {
    try {
      await api.removeFromWishlist(productId)
      setItems(items.filter(i => i.id !== productId))
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddToCart = async (product) => {
    const result = await addItem(product)
    if (!result?.error) {
      setAddedId(product.id)
      setTimeout(() => setAddedId(null), 1200)
    }
  }

  if (!user) {
    return (
      <section className="section" style={{ paddingTop: 140, textAlign: 'center' }}>
        <div className="container">
          <Heart size={48} strokeWidth={1} style={{ color: 'var(--text-light)', marginBottom: 16 }} />
          <h2 style={{ fontFamily: 'var(--ff-heading)', marginBottom: 12 }}>Your Wishlist</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Sign in to save your favorite coffees for later.</p>
          <Link to="/login" className="btn btn--primary">Sign In</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="section" style={{ paddingTop: 140 }}>
      <div className="container">
        <span className="section-label">Your Collection</span>
        <h1 className="section-title" style={{ marginBottom: 32 }}>Saved Items</h1>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Heart size={48} strokeWidth={1} style={{ color: 'var(--text-light)', marginBottom: 16 }} />
            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Your wishlist is empty.</p>
            <Link to="/shop" className="btn btn--primary">Browse Coffee</Link>
          </div>
        ) : (
          <div className="products-grid">
            <AnimatePresence>
              {items.map(p => (
                <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="product-card">
                  <div className="product-img-wrap">
                    <Link to={`/shop/${p.id}`}>
                      <img src={p.img} alt={p.name} className="product-img" loading="lazy" />
                    </Link>
                    <button className="wishlist-remove-btn" onClick={() => handleRemove(p.id)} aria-label="Remove from wishlist">
                      <Trash2 size={14} />
                    </button>
                    {p.badge && <span className="product-badge">{p.badge}</span>}
                  </div>
                  <div className="product-info">
                    <Link to={`/shop/${p.id}`}><h3 className="product-name">{p.name}</h3></Link>
                    <div className="product-meta">
                      <span>{p.size}</span>
                      <span className="product-rating">{p.rating} <Star size={12} fill="currentColor" /> ({p.reviews_count || 0})</span>
                    </div>
                    <p className="product-notes">{p.tasting_notes}</p>
                    <div className="product-footer">
                      <span className="product-price">${p.price.toFixed(2)}</span>
                      <button className={`btn btn--primary btn--sm ${addedId === p.id ? 'btn--success' : ''}`} onClick={() => handleAddToCart(p)}>
                        {addedId === p.id ? 'Added' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      <CartSidebar />
    </section>
  )
}
