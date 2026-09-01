import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RefreshCw, Pause, Play, Trash2, Package, Clock, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'

const frequencies = [
  { key: 'weekly', label: 'Weekly', desc: 'Every 7 days', saves: '20%' },
  { key: 'biweekly', label: 'Bi-Weekly', desc: 'Every 14 days', saves: '18%' },
  { key: 'monthly', label: 'Monthly', desc: 'Every 30 days', saves: '15%' },
  { key: 'quarterly', label: 'Quarterly', desc: 'Every 90 days', saves: '12%' },
]

const plans = [
  {
    name: 'Personal',
    frequency: 'monthly',
    quantity: 1,
    desc: 'Perfect for the daily coffee drinker who appreciates quality.',
    features: ['1 bag per delivery', '15% off retail price', 'Free shipping on every order', 'Skip or cancel anytime'],
    popular: false
  },
  {
    name: 'Household',
    frequency: 'monthly',
    quantity: 2,
    desc: 'Keep the whole household stocked with premium Ethiopian coffee.',
    features: ['2 bags per delivery', '18% off retail price', 'Free shipping on every order', 'Mix and match varieties', 'Skip or cancel anytime'],
    popular: true
  },
  {
    name: 'Office',
    frequency: 'monthly',
    quantity: 5,
    desc: 'Fresh coffee for your team. Impress clients and keep employees happy.',
    features: ['5 bags per delivery', '25% off retail price', 'Free priority shipping', 'Custom variety selection', 'Dedicated account support', 'Skip or cancel anytime'],
    popular: false
  }
]

export default function Subscriptions() {
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [customizing, setCustomizing] = useState(false)
  const [customProduct, setCustomProduct] = useState('')
  const [customFreq, setCustomFreq] = useState('monthly')
  const [customQty, setCustomQty] = useState(1)

  useEffect(() => {
    api.getProducts({ limit: 50 }).then(data => {
      setProducts(data.products || [])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (user) {
      api.getSubscriptions().then(setSubscriptions).catch(() => {}).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user])

  const handleSubscribe = async (plan) => {
    if (!user) {
      window.location.href = '/login'
      return
    }
    try {
      const sub = await api.createSubscription({
        product_id: 1, // Default to Yirgacheffe
        quantity: plan.quantity,
        frequency: plan.frequency,
      })
      setSubscriptions(prev => [sub, ...prev])
      setSelectedPlan(null)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleCustomSubscribe = async () => {
    if (!user) { window.location.href = '/login'; return }
    if (!customProduct) { alert('Please select a product'); return }
    try {
      const sub = await api.createSubscription({
        product_id: parseInt(customProduct),
        quantity: customQty,
        frequency: customFreq,
      })
      setSubscriptions(prev => [sub, ...prev])
      setCustomizing(false)
    } catch (err) {
      alert(err.message)
    }
  }

  const handlePause = async (id) => {
    try {
      const sub = subscriptions.find(s => s.id === id)
      const newStatus = sub.status === 'paused' ? 'active' : 'paused'
      const updated = await api.updateSubscription(id, { status: newStatus })
      setSubscriptions(prev => prev.map(s => s.id === id ? updated : s))
    } catch (err) {
      alert(err.message)
    }
  }

  const handleCancel = async (id) => {
    if (!confirm('Cancel this subscription?')) return
    try {
      await api.cancelSubscription(id)
      setSubscriptions(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="shop-hero" style={{ paddingBottom: 40 }}>
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="section-label">Subscribe & Save</span>
            <h1 className="shop-title">Never Run Out of <em>Great Coffee</em></h1>
            <p className="shop-subtitle">Set up recurring deliveries and save up to 40%. Pause, skip, or cancel anytime — no commitment required.</p>
          </motion.div>
        </div>
      </section>

      {/* Plans */}
      <section className="section" style={{ paddingTop: 60 }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className={`quality-card ${plan.popular ? '' : ''}`}
                style={{
                  background: plan.popular ? 'var(--brown-900)' : 'var(--white)',
                  color: plan.popular ? 'var(--white)' : 'var(--text)',
                  border: plan.popular ? '2px solid var(--gold)' : '1px solid var(--border)',
                  position: 'relative'
                }}
              >
                {plan.popular && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--gold)', color: 'var(--brown-900)', padding: '4px 16px', borderRadius: 'var(--radius-pill)', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase' }}>
                    Most Popular
                  </div>
                )}
                <h3 style={{ fontFamily: 'var(--ff-heading)', fontSize: '1.4rem', marginBottom: 8 }}>{plan.name}</h3>
                <p style={{ fontSize: '.88rem', color: plan.popular ? 'rgba(255,255,255,.6)' : 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>{plan.desc}</p>
                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontFamily: 'var(--ff-heading)', fontSize: '2.2rem', fontWeight: 700, color: plan.popular ? 'var(--gold-light)' : 'var(--brown-700)' }}>
                    {plan.quantity === 1 ? '$21.24' : plan.quantity === 2 ? '$40.19' : '$95.86'}
                  </span>
                  <span style={{ fontSize: '.85rem', color: plan.popular ? 'rgba(255,255,255,.5)' : 'var(--text-muted)' }}> /month</span>
                  <div style={{ fontSize: '.78rem', color: 'var(--gold)', marginTop: 4, fontWeight: 600 }}>
                    Save {plan.quantity >= 5 ? '25%' : plan.quantity >= 2 ? '18%' : '15%'} vs retail
                  </div>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: 28 }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ padding: '6px 0', fontSize: '.88rem', color: plan.popular ? 'rgba(255,255,255,.7)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <RefreshCw size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`btn ${plan.popular ? 'btn--primary' : 'btn--outline-dark'} btn--block`}
                  onClick={() => handleSubscribe(plan)}
                >
                  Start Subscription
                </button>
              </motion.div>
            ))}
          </div>

          {/* Frequency selector */}
          <div style={{ marginTop: 48, textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'var(--ff-heading)', fontSize: '1.2rem', marginBottom: 16 }}>Choose Your Delivery Schedule</h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              {frequencies.map(f => (
                <div key={f.key} style={{ padding: '16px 24px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', textAlign: 'center', minWidth: 130 }}>
                  <div style={{ fontWeight: 600, fontSize: '.92rem', marginBottom: 4 }}>{f.label}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>{f.desc}</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--gold)', fontWeight: 600, marginTop: 4 }}>Save {f.saves}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom plan CTA */}
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <button className="btn btn--outline-dark btn--sm" onClick={() => setCustomizing(!customizing)}>
              {customizing ? 'Close' : 'Build a Custom Plan'}
            </button>
          </div>

          {customizing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{ maxWidth: 500, margin: '24px auto 0', padding: 24, background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
            >
              <h4 style={{ fontFamily: 'var(--ff-heading)', marginBottom: 16 }}>Customize Your Subscription</h4>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Coffee</label>
                <select value={customProduct} onChange={e => setCustomProduct(e.target.value)} style={{ padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.9rem', width: '100%' }}>
                  <option value="">Select a product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — ${p.price.toFixed(2)}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div className="form-group">
                  <label>Frequency</label>
                  <select value={customFreq} onChange={e => setCustomFreq(e.target.value)} style={{ padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.9rem', width: '100%' }}>
                    {frequencies.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <input type="number" min="1" max="50" value={customQty} onChange={e => setCustomQty(parseInt(e.target.value) || 1)} style={{ padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.9rem' }} />
                </div>
              </div>
              <button className="btn btn--primary btn--block" onClick={handleCustomSubscribe}>Create Custom Subscription</button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Active Subscriptions */}
      {user && subscriptions.length > 0 && (
        <section className="section section--cream" style={{ paddingTop: 60 }}>
          <div className="container" style={{ maxWidth: 800 }}>
            <h2 className="section-title" style={{ marginBottom: 24 }}>Your <em>Subscriptions</em></h2>
            {subscriptions.map(sub => (
              <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: 12 }}>
                {sub.product_img && (
                  <img src={sub.product_img} alt={sub.product_name} style={{ width: 56, height: 56, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} loading="lazy" />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{sub.product_name}</div>
                  <div style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>
                    {sub.quantity}x per delivery, {sub.frequency} &middot; ${sub.price_per_unit.toFixed(2)}/bag &middot; Save {sub.discount_percent}%
                  </div>
                  {sub.next_delivery && (
                    <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      <Clock size={12} style={{ verticalAlign: -2 }} /> Next delivery: {new Date(sub.next_delivery).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handlePause(sub.id)} className="btn btn--sm" style={{ padding: '8px 14px', fontSize: '.78rem' }}>
                    {sub.status === 'paused' ? <><Play size={14} /> Resume</> : <><Pause size={14} /> Pause</>}
                  </button>
                  <button onClick={() => handleCancel(sub.id)} className="btn btn--sm" style={{ padding: '8px 14px', fontSize: '.78rem', color: '#c0392b', border: '1px solid #c0392b' }}>
                    <Trash2 size={14} /> Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Benefits */}
      <section className="section">
        <div className="container">
          <div className="section-header section-header--center">
            <span className="section-label">Why Subscribe</span>
            <h2 className="section-title">Fresh Coffee, <em>Zero Effort</em></h2>
          </div>
          <div className="quality-grid">
            {[
              { title: 'Never Run Out', text: 'Your favorite coffee arrives on schedule, every time. No more last-minute store runs or settling for mediocre beans.', icon: Package },
              { title: 'Real Savings', text: 'Subscribers save 12-40% off retail pricing. The more you order, the more you save. Volume discounts stack with subscription discounts.', icon: RefreshCw },
              { title: 'Full Flexibility', text: 'Pause for vacation, switch varieties, change frequency, or cancel entirely — all from your account page with zero penalties.', icon: Pause },
            ].map((q, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <div className="quality-card" style={{ background: 'var(--white)', color: 'var(--text)' }}>
                  <div className="quality-card-icon" style={{ color: 'var(--gold)' }}>
                    <q.icon size={36} strokeWidth={1.2} />
                  </div>
                  <h3 className="quality-card-title" style={{ color: 'var(--text)' }}>{q.title}</h3>
                  <p className="quality-card-text" style={{ color: 'var(--text-muted)' }}>{q.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
