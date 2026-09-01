import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Search, SlidersHorizontal } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import CartSidebar from '../components/CartSidebar'



const filters = [
  { key: 'all', label: 'All Origins' },
  { key: 'yirgacheffe', label: 'Yirgacheffe' },
  { key: 'sidamo', label: 'Sidamo' },
  { key: 'harrar', label: 'Harrar' },
  { key: 'limu', label: 'Limu' },
  { key: 'jimma', label: 'Jimma' },
  { key: 'blend', label: 'Blends' },
]

const sortOptions = [
  { key: 'popular', label: 'Most Popular' },
  { key: 'price_asc', label: 'Price: Low to High' },
  { key: 'price_desc', label: 'Price: High to Low' },
  { key: 'rating', label: 'Highest Rated' },
  { key: 'newest', label: 'Newest First' },
]

export default function Shop() {
  const [active, setActive] = useState('all')
  const [sort, setSort] = useState('popular')
  const [search, setSearch] = useState('')
  const [addedId, setAddedId] = useState(null)
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loginPrompt, setLoginPrompt] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const { addItem } = useCart()
  const { user } = useAuth()

  useEffect(() => {
    const params = { limit: 50 }
    if (search) params.search = search
    if (active !== 'all') params.region = active
    if (sort !== 'popular') params.sort = sort
    api.getProducts(params).then(data => {
      setProducts(data.products || [])
    }).catch(() => {}).finally(() => setLoadingProducts(false))
  }, [search, active, sort])

  const handleAdd = async (e, product) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      setLoginPrompt(true)
      setTimeout(() => setLoginPrompt(false), 3000)
      return
    }
    const result = await addItem(product)
    if (result?.error) {
      alert(result.error)
      return
    }
    setAddedId(product.id)
    setTimeout(() => setAddedId(null), 1200)
  }

  const displayProducts = active === 'all' && !search ? products : products.filter(p => {
    if (active !== 'all' && p.region !== active) return false
    return true
  })

  return (
    <>
      <section className="shop-hero">
        <div className="container">
          <span className="section-label">Our Collection</span>
          <h1 className="shop-title">Premium Ethiopian <em>Coffee</em></h1>
          <p className="shop-subtitle">Hand-selected, expertly roasted beans from the birthplace of coffee. Free worldwide shipping on orders over $50.</p>

          <div className="shop-search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by name, origin, or tasting note..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="shop-search-input"
            />
            <button className="filter-toggle-btn" onClick={() => setShowFilters(f => !f)}>
              <SlidersHorizontal size={16} /> Filters
            </button>
          </div>

          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <div className="filter-bar">
                {filters.map(f => (
                  <button key={f.key} className={`filter-btn ${active === f.key ? 'filter-btn--active' : ''}`} onClick={() => setActive(f.key)}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="sort-bar">
                <label>Sort by</label>
                <select value={sort} onChange={e => setSort(e.target.value)} className="sort-select">
                  {sortOptions.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
            </motion.div>
          )}

          {loginPrompt && <p style={{ color: '#C8A96E', marginTop: '0.5rem', fontSize: '.9rem' }}>Please <Link to="/login" style={{ color: '#C8A96E', textDecoration: 'underline' }}>sign in</Link> to add items to cart.</p>}
        </div>
      </section>

      <section className="section shop-products">
        <div className="container">
          <div className="products-grid">
            <AnimatePresence mode="popLayout">
              {displayProducts.map(p => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="product-card"
                >
                  <Link to={`/shop/${p.id}`} className="product-img-wrap">
                    <img src={p.img} alt={p.name} className="product-img" loading="lazy" />
                    {p.badge && <span className="product-badge">{p.badge}</span>}
                  </Link>
                  <div className="product-info">
                    <Link to={`/shop/${p.id}`}><h3 className="product-name">{p.name}</h3></Link>
                    <div className="product-meta">
                      <span>{p.size}</span>
                      <span className="product-rating">{p.rating} <Star size={12} fill="currentColor" /> ({p.reviews_count || 0})</span>
                    </div>
                    <p className="product-notes">{p.tasting_notes}</p>
                    <div className="product-footer">
                      <span className="product-price">${p.price.toFixed(2)}</span>
                      <button className={`btn btn--primary btn--sm ${addedId === p.id ? 'btn--success' : ''}`} onClick={(e) => handleAdd(e, p)}>
                        {addedId === p.id ? 'Added' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {loadingProducts && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>Loading products...</p>
            </div>
          )}
          {!loadingProducts && displayProducts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>No products found.</p>
              <button className="btn btn--outline-dark" style={{ marginTop: 16 }} onClick={() => { setSearch(''); setActive('all') }}>Clear Filters</button>
            </div>
          )}
        </div>
      </section>

      <CartSidebar />
    </>
  )
}
