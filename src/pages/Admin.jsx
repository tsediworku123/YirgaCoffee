import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'

export default function Admin() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [reviews, setReviews] = useState([])
  const [messages, setMessages] = useState([])
  const [orderFilter, setOrderFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [editProduct, setEditProduct] = useState(null)
  const [productForm, setProductForm] = useState({})

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/login'); return }
    loadStats()
  }, [user])

  const loadStats = async () => {
    try {
      const s = await api.getStats()
      setStats(s)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try { setProducts(await api.adminGetProducts()) } catch {}
  }
  const loadOrders = async () => {
    try { setOrders(await api.adminGetOrders(orderFilter === 'all' ? '' : orderFilter)) } catch {}
  }
  const loadUsers = async () => {
    try { setUsers(await api.adminGetUsers()) } catch {}
  }
  const loadReviews = async () => {
    try { setReviews(await api.adminGetReviews()) } catch {}
  }
  const loadMessages = async () => {
    try { setMessages(await api.adminGetMessages()) } catch {}
  }

  useEffect(() => {
    if (tab === 'products') loadProducts()
    if (tab === 'orders') loadOrders()
    if (tab === 'users') loadUsers()
    if (tab === 'reviews') loadReviews()
    if (tab === 'messages') loadMessages()
  }, [tab, orderFilter])

  const handleOrderStatus = async (orderId, status) => {
    try {
      await api.adminUpdateOrder(orderId, { status })
      loadOrders()
    } catch (err) { alert(err.message) }
  }

  const handleDeleteProduct = async (id) => {
    if (!confirm('Deactivate this product?')) return
    try {
      await api.adminDeleteProduct(id)
      loadProducts()
    } catch (err) { alert(err.message) }
  }

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    try {
      if (editProduct) {
        await api.adminUpdateProduct(editProduct.id, productForm)
      } else {
        await api.adminCreateProduct(productForm)
      }
      setEditProduct(null)
      setProductForm({})
      loadProducts()
    } catch (err) { alert(err.message) }
  }

  const openEdit = (p) => {
    setEditProduct(p)
    setProductForm({ ...p })
    setTab('product-form')
  }

  if (!user || user.role !== 'admin') return null

  return (
    <section className="admin-page">
      <div className="container">
        <div className="admin-layout">
          <aside className="admin-sidebar">
            <h3>Admin</h3>
            <nav>
              <button className={`admin-nav ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>Dashboard</button>
              <button className={`admin-nav ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>Products</button>
              <button className={`admin-nav ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>Orders</button>
              <button className={`admin-nav ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>Users</button>
              <button className={`admin-nav ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>Reviews</button>
              <button className={`admin-nav ${tab === 'messages' ? 'active' : ''}`} onClick={() => setTab('messages')}>Messages {stats?.unreadMessages > 0 && <span className="badge">{stats.unreadMessages}</span>}</button>
              <Link to="/" className="admin-nav">Back to Site</Link>
              <button className="admin-nav" onClick={() => { logout(); navigate('/login') }} style={{ color: '#E74C3C', marginTop: 8 }}>Logout</button>
            </nav>
          </aside>

          <main className="admin-main">
            {tab === 'dashboard' && stats && (
              <div>
                <h2>Dashboard</h2>
                <div className="stats-grid">
                  <div className="stat-card"><span className="stat-value">{stats.totalOrders}</span><span className="stat-label">Orders</span></div>
                  <div className="stat-card"><span className="stat-value">${stats.totalRevenue.toFixed(2)}</span><span className="stat-label">Revenue</span></div>
                  <div className="stat-card"><span className="stat-value">{stats.totalProducts}</span><span className="stat-label">Products</span></div>
                  <div className="stat-card"><span className="stat-value">{stats.totalUsers}</span><span className="stat-label">Customers</span></div>
                </div>
                {stats.pendingOrders > 0 && <div className="admin-alert">You have {stats.pendingOrders} pending order(s)</div>}
                <h3>Recent Orders</h3>
                <div className="orders-list">
                  {stats.recentOrders.map(o => (
                    <div key={o.id} className="order-card">
                      <div className="order-header">
                        <span>#{o.id} - {o.customer_name}</span>
                        <span className="order-status">${o.total.toFixed(2)} | {o.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {stats.lowStock.length > 0 && (
                  <>
                    <h3>Low Stock Alert</h3>
                    {stats.lowStock.map(p => (
                      <div key={p.id} className="admin-alert">{p.name} - {p.stock} units left</div>
                    ))}
                  </>
                )}
              </div>
            )}

            {tab === 'products' && (
              <div>
                <div className="admin-header">
                  <h2>Products ({products.length})</h2>
                  <button className="btn btn--primary btn--sm" onClick={() => { setEditProduct(null); setProductForm({ name: '', slug: '', description: '', price: 0, region: 'yirgacheffe', stock: 100, size: '250g', roast_level: 'medium', process: 'Washed', img: '', badge: '', tasting_notes: '', featured: 0, active: 1 }); setTab('product-form') }}>
                    Add Product
                  </button>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead><tr><th>ID</th><th>Name</th><th>Region</th><th>Price</th><th>Stock</th><th>Rating</th><th>Actions</th></tr></thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id}>
                          <td>{p.id}</td><td>{p.name}</td><td>{p.region}</td><td>${p.price.toFixed(2)}</td>
                          <td className={p.stock < 20 ? 'text-danger' : ''}>{p.stock}</td><td>{p.rating}</td>
                          <td>
                            <button className="btn btn--ghost btn--sm" onClick={() => openEdit(p)}>Edit</button>
                            <button className="btn btn--ghost btn--sm text-danger" onClick={() => handleDeleteProduct(p.id)}>Deactivate</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'product-form' && (
              <div>
                <h2>{editProduct ? 'Edit Product' : 'New Product'}</h2>
                <form onSubmit={handleSaveProduct} className="auth-form">
                  <div className="form-row">
                    <div className="form-group"><label>Name *</label><input value={productForm.name || ''} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required /></div>
                    <div className="form-group"><label>Slug</label><input value={productForm.slug || ''} onChange={e => setProductForm({ ...productForm, slug: e.target.value })} /></div>
                  </div>
                  <div className="form-group"><label>Description</label><textarea rows={3} value={productForm.description || ''} onChange={e => setProductForm({ ...productForm, description: e.target.value })} /></div>
                  <div className="form-row">
                    <div className="form-group"><label>Price *</label><input type="number" step="0.01" value={productForm.price || ''} onChange={e => setProductForm({ ...productForm, price: parseFloat(e.target.value) })} required /></div>
                    <div className="form-group"><label>Stock</label><input type="number" value={productForm.stock || 0} onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value) })} /></div>
                    <div className="form-group"><label>Size</label><input value={productForm.size || '250g'} onChange={e => setProductForm({ ...productForm, size: e.target.value })} /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Region</label><select value={productForm.region || 'yirgacheffe'} onChange={e => setProductForm({ ...productForm, region: e.target.value })}>
                      <option value="yirgacheffe">Yirgacheffe</option><option value="sidamo">Sidamo</option><option value="harrar">Harrar</option><option value="limu">Limu</option><option value="jimma">Jimma</option><option value="blend">Blend</option>
                    </select></div>
                    <div className="form-group"><label>Roast</label><select value={productForm.roast_level || 'medium'} onChange={e => setProductForm({ ...productForm, roast_level: e.target.value })}>
                      <option value="light">Light</option><option value="medium">Medium</option><option value="medium-dark">Medium Dark</option><option value="dark">Dark</option><option value="green">Green</option>
                    </select></div>
                    <div className="form-group"><label>Process</label><input value={productForm.process || ''} onChange={e => setProductForm({ ...productForm, process: e.target.value })} /></div>
                  </div>
                  <div className="form-group"><label>Image URL</label><input value={productForm.img || ''} onChange={e => setProductForm({ ...productForm, img: e.target.value })} /></div>
                  <div className="form-group"><label>Badge</label><input value={productForm.badge || ''} onChange={e => setProductForm({ ...productForm, badge: e.target.value })} placeholder="Best Seller, Limited, Popular" /></div>
                  <div className="form-group"><label>Tasting Notes</label><input value={productForm.tasting_notes || ''} onChange={e => setProductForm({ ...productForm, tasting_notes: e.target.value })} placeholder="Bergamot,Citrus,Floral" /></div>
                  <div className="form-group"><label><input type="checkbox" checked={!!productForm.featured} onChange={e => setProductForm({ ...productForm, featured: e.target.checked ? 1 : 0 })} /> Featured</label></div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn--primary">{editProduct ? 'Update' : 'Create'} Product</button>
                    <button type="button" className="btn btn--ghost" onClick={() => setTab('products')}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {tab === 'orders' && (
              <div>
                <h2>Orders</h2>
                <div className="filter-bar" style={{ marginBottom: '1rem' }}>
                  {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                    <button key={s} className={`filter-btn ${orderFilter === s ? 'filter-btn--active' : ''}`} onClick={() => setOrderFilter(s)}>{s}</button>
                  ))}
                </div>
                <div className="orders-list">
                  {orders.map(o => (
                    <div key={o.id} className="order-card">
                      <div className="order-header">
                        <div>
                          <strong>Order #{o.id}</strong> - {o.customer_name} ({o.customer_email})
                          <span className="order-date">{new Date(o.created_at).toLocaleDateString()}</span>
                        </div>
                        <span className="order-status">${o.total.toFixed(2)} | {o.payment_status}</span>
                      </div>
                      <div className="order-items">
                        {o.items.map(i => (
                          <div key={i.id} className="order-item">
                            <span>{i.product_name} x{i.quantity}</span>
                            <span>${(i.price * i.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="order-actions">
                        {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map(s => (
                          <button key={s} className={`filter-btn btn--sm ${o.status === s ? 'filter-btn--active' : ''}`} onClick={() => handleOrderStatus(o.id, s)}>{s}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'users' && (
              <div>
                <h2>Users ({users.length})</h2>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Company</th><th>Joined</th></tr></thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}><td>{u.id}</td><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.company || '-'}</td><td>{new Date(u.created_at).toLocaleDateString()}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'reviews' && (
              <div>
                <h2>Reviews ({reviews.length})</h2>
                {reviews.map(r => (
                  <div key={r.id} className="order-card">
                    <div className="order-header"><strong>{r.product_name}</strong> - {r.rating}/5 by {r.author_name}</div>
                    {r.title && <p><strong>{r.title}</strong></p>}
                    <p>{r.text}</p>
                    <button className={`filter-btn btn--sm ${r.approved ? 'filter-btn--active' : ''}`} onClick={async () => { await api.adminApproveReview(r.id, { approved: !r.approved }); loadReviews() }}>
                      {r.approved ? 'Approved' : 'Pending'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {tab === 'messages' && (
              <div>
                <h2>Contact Messages ({messages.length})</h2>
                {messages.map(m => (
                  <div key={m.id} className={`order-card ${!m.read ? 'order-card--unread' : ''}`}>
                    <div className="order-header">
                      <div><strong>{m.name}</strong> ({m.email}) - {m.company || 'No company'}</div>
                      <span className="order-date">{new Date(m.created_at).toLocaleDateString()}</span>
                    </div>
                    <p>Interest: {m.interest || 'Not specified'}</p>
                    <p>{m.message}</p>
                    {!m.read && <button className="btn btn--ghost btn--sm" onClick={async () => { await api.adminReadMessage(m.id); loadMessages() }}>Mark as Read</button>}
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </section>
  )
}
