import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, Heart, ShoppingBag, ArrowLeft, User } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import CartSidebar from '../components/CartSidebar'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [wishlisted, setWishlisted] = useState(false)
  const [added, setAdded] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', text: '' })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewMsg, setReviewMsg] = useState('')
  const { addItem } = useCart()
  const { user } = useAuth()

  useEffect(() => {
    Promise.all([
      api.getProduct(id),
      api.getProductReviews(id).catch(() => []),
    ]).then(([p, r]) => {
      setProduct(p)
      setReviews(r)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (user && product) {
      api.checkWishlist(product.id).then(d => setWishlisted(d.wishlisted)).catch(() => {})
    }
  }, [user, product])

  const toggleWishlist = async () => {
    if (!user) return
    try {
      const res = await api.toggleWishlist(product.id)
      setWishlisted(res.wishlisted)
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddToCart = async () => {
    if (!user) return
    const result = await addItem(product)
    if (!result?.error) {
      setAdded(true)
      setTimeout(() => setAdded(false), 1500)
    }
  }

  const submitReview = async (e) => {
    e.preventDefault()
    if (!user) return
    setReviewSubmitting(true)
    try {
      await api.addReview(product.id, reviewForm)
      const updated = await api.getProductReviews(id)
      setReviews(updated)
      const updatedProduct = await api.getProduct(id)
      setProduct(updatedProduct)
      setReviewForm({ rating: 5, title: '', text: '' })
      setReviewMsg('Review submitted successfully')
      setTimeout(() => setReviewMsg(''), 3000)
    } catch (err) {
      setReviewMsg(err.message)
    } finally {
      setReviewSubmitting(false)
    }
  }

  if (loading) return <div className="checkout-page" style={{ padding: '140px 0', textAlign: 'center' }}>Loading...</div>
  if (!product) return <div className="checkout-page" style={{ padding: '140px 0', textAlign: 'center' }}>Product not found</div>

  return (
    <>
      <section className="section product-detail-page">
        <div className="container">
          <Link to="/shop" className="checkout-back" style={{ marginBottom: 24, display: 'inline-flex' }}>
            <ArrowLeft size={16} /> Back to Shop
          </Link>

          <div className="product-detail-grid">
            <motion.div className="product-detail-img-wrap" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <img src={product.img} alt={product.name} className="product-detail-img" />
              {product.badge && <span className="product-badge">{product.badge}</span>}
            </motion.div>

            <motion.div className="product-detail-info" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <span className="product-detail-region">{product.region} region</span>
              <h1 className="product-detail-name">{product.name}</h1>
              <div className="product-detail-rating">
                <div className="stars">{[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < Math.round(product.rating) ? 'currentColor' : 'none'} />)}</div>
                <span>{product.rating} ({product.reviews_count} reviews)</span>
              </div>
              <p className="product-detail-desc">{product.description}</p>

              <div className="product-detail-meta-grid">
                <div className="meta-item"><strong>Region</strong><span>{product.origin}</span></div>
                <div className="meta-item"><strong>Altitude</strong><span>{product.altitude}</span></div>
                <div className="meta-item"><strong>Roast</strong><span>{product.roast_level}</span></div>
                <div className="meta-item"><strong>Process</strong><span>{product.process}</span></div>
                <div className="meta-item"><strong>Size</strong><span>{product.size}</span></div>
                <div className="meta-item"><strong>Stock</strong><span>{product.stock > 0 ? `${product.stock} units` : 'Out of stock'}</span></div>
              </div>

              {product.tasting_notes && (
                <div className="product-detail-notes">
                  <strong>Tasting Notes</strong>
                  <div className="notes-list">
                    {product.tasting_notes.split(',').map((note, i) => <span key={i} className="note-tag">{note.trim()}</span>)}
                  </div>
                </div>
              )}

              <div className="product-detail-price-row">
                <span className="product-detail-price">${product.price.toFixed(2)}</span>
                <span className="product-detail-size">{product.size}</span>
              </div>

              <div className="product-detail-actions">
                <button onClick={handleAddToCart} className={`btn btn--primary btn--lg ${added ? 'btn--success' : ''}`} disabled={!user || product.stock <= 0}>
                  <ShoppingBag size={18} />
                  {added ? 'Added to Cart' : product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <button onClick={toggleWishlist} className={`btn btn--outline-dark btn--lg wishlist-btn ${wishlisted ? 'wishlist-btn--active' : ''}`} disabled={!user}>
                  <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
                </button>
              </div>
              {!user && <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginTop: 8 }}><Link to="/login" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>Sign in</Link> to purchase</p>}
            </motion.div>
          </div>

          {/* Reviews Section */}
          <div className="product-reviews-section">
            <h2 className="section-title" style={{ fontSize: '1.6rem', marginTop: 60 }}>Customer Reviews</h2>

            {user && (
              <form className="review-form" onSubmit={submitReview}>
                <h3>Write a Review</h3>
                <div className="review-rating-select">
                  <label>Rating</label>
                  <div className="star-select">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button" onClick={() => setReviewForm(f => ({...f, rating: n}))} className="star-btn">
                        <Star size={20} fill={n <= reviewForm.rating ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" value={reviewForm.title} onChange={e => setReviewForm(f => ({...f, title: e.target.value}))} placeholder="Great coffee!" />
                </div>
                <div className="form-group">
                  <label>Your Review</label>
                  <textarea rows="4" value={reviewForm.text} onChange={e => setReviewForm(f => ({...f, text: e.target.value}))} placeholder="Share your experience with this coffee..." />
                </div>
                <button type="submit" className="btn btn--primary btn--sm" disabled={reviewSubmitting}>
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
                {reviewMsg && <p style={{ fontSize: '.85rem', color: reviewMsg.includes('success') ? 'var(--success)' : '#E74C3C', marginTop: 8 }}>{reviewMsg}</p>}
              </form>
            )}

            <div className="reviews-list">
              {reviews.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', padding: '24px 0' }}>No reviews yet. Be the first to review this product.</p>
              ) : reviews.map(r => (
                <div key={r.id} className="review-card">
                  <div className="review-header">
                    <div className="review-author">
                      <div className="author-avatar-sm"><User size={16} /></div>
                      <div>
                        <strong>{r.author_name}</strong>
                        <span>{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="review-stars">{[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < r.rating ? 'currentColor' : 'none'} />)}</div>
                  </div>
                  {r.title && <h4 className="review-title">{r.title}</h4>}
                  <p className="review-text">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <CartSidebar />
    </>
  )
}
