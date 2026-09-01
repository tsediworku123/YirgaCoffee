import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'

export default function Account() {
  const { user, logout, updateProfile } = useAuth()
  const [orders, setOrders] = useState([])
  const [tab, setTab] = useState('orders')
  const [profile, setProfile] = useState({ name: '', phone: '', company: '' })
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name || '', phone: user.phone || '', company: user.company || '' })
      api.getOrders().then(setOrders).catch(() => {}).finally(() => setLoading(false))
    }
  }, [user])

  const handleProfile = async (e) => {
    e.preventDefault()
    try {
      await updateProfile(profile)
      setMsg('Profile updated')
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg(err.message)
    }
  }

  const handlePassword = async (e) => {
    e.preventDefault()
    try {
      await api.changePassword(pwForm)
      setPwForm({ currentPassword: '', newPassword: '' })
      setMsg('Password changed')
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg(err.message)
    }
  }

  const statusColor = (s) => {
    const colors = { pending: '#C8A96E', confirmed: '#4A90D9', processing: '#4A90D9', shipped: '#27AE60', delivered: '#27AE60', cancelled: '#E74C3C', refunded: '#95A5A6' }
    return colors[s] || '#666'
  }

  if (!user) return <section className="auth-page"><div className="auth-container"><p>Please <Link to="/login">sign in</Link> to view your account.</p></div></section>

  return (
    <section className="account-page">
      <div className="container">
        <div className="account-header">
          <h1>Welcome, {user.name}</h1>
          <p>{user.email} {user.company && `| ${user.company}`} {user.role === 'admin' && <span className="badge badge--gold">Admin</span>}</p>
        </div>

        <div className="account-tabs">
          <button className={`filter-btn ${tab === 'orders' ? 'filter-btn--active' : ''}`} onClick={() => setTab('orders')}>Orders ({orders.length})</button>
          <button className={`filter-btn ${tab === 'profile' ? 'filter-btn--active' : ''}`} onClick={() => setTab('profile')}>Profile</button>
          <button className={`filter-btn ${tab === 'security' ? 'filter-btn--active' : ''}`} onClick={() => setTab('security')}>Security</button>
          {user.role === 'admin' && <Link to="/admin" className="filter-btn">Admin Dashboard</Link>}
          <button className="filter-btn" onClick={logout}>Sign Out</button>
        </div>

        {msg && <div className="auth-error" style={{ background: '#27AE60', color: '#fff' }}>{msg}</div>}

        {tab === 'orders' && (
          <div className="account-section">
            {loading ? <p>Loading orders...</p> : orders.length === 0 ? (
              <div className="cart-empty">
                <p>No orders yet</p>
                <Link to="/shop" className="btn btn--primary">Start Shopping</Link>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map(order => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <div>
                        <strong>Order #{order.id}</strong>
                        <span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className="order-status" style={{ color: statusColor(order.status) }}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="order-items">
                      {order.items.map(item => (
                        <div key={item.id} className="order-item">
                          <img src={item.product_img} alt={item.product_name} className="cart-item-img" />
                          <span>{item.product_name} x{item.quantity}</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="order-footer">
                      <span>Total: <strong>${order.total.toFixed(2)}</strong></span>
                      {order.tracking_number && <span>Tracking: {order.tracking_number}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div className="account-section">
            <form onSubmit={handleProfile} className="auth-form">
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={user.email} disabled />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Company</label>
                <input type="text" value={profile.company} onChange={e => setProfile({ ...profile, company: e.target.value })} />
              </div>
              <button type="submit" className="btn btn--primary">Save Changes</button>
            </form>
          </div>
        )}

        {tab === 'security' && (
          <div className="account-section">
            <form onSubmit={handlePassword} className="auth-form">
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} required minLength={6} />
              </div>
              <button type="submit" className="btn btn--primary">Change Password</button>
            </form>
          </div>
        )}
      </div>
    </section>
  )
}
