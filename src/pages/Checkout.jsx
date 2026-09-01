import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CreditCard, Lock, Check, ArrowLeft, ShoppingBag, AlertCircle } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import PaymentForm from '../components/PaymentForm'

const countries = [
  'Ethiopia', 'United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Netherlands',
  'Japan', 'Australia', 'South Korea', 'Italy', 'Spain', 'Sweden', 'Switzerland',
  'Norway', 'Denmark', 'Finland', 'Belgium', 'Austria', 'Ireland', 'Portugal',
  'China', 'India', 'Brazil', 'Mexico', 'UAE', 'Saudi Arabia', 'Singapore',
  'New Zealand', 'South Africa', 'Israel', 'Poland', 'Czech Republic', 'Kenya', 'Nigeria', 'Other'
]

export default function Checkout() {
  const { items, subtotal, shipping, tax, total, clearAll } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState(null)
  const [errors, setErrors] = useState({})
  const [clientSecret, setClientSecret] = useState(null)
  const [orderNotes, setOrderNotes] = useState('')
  const [form, setForm] = useState({
    shipping_name: user?.name || '',
    shipping_email: user?.email || '',
    shipping_address: '',
    shipping_city: '',
    shipping_country: '',
    shipping_postal: '',
    shipping_phone: '',
    notes: '',
  })

  useEffect(() => {
    if (!user) navigate('/login')

    // Handle Chapa return FIRST (before cart check)
    const params = new URLSearchParams(window.location.search)
    const paymentStatus = params.get('payment')
    const txRef = params.get('tx_ref')
    if (paymentStatus === 'chapa' && txRef) {
      // User returned from Chapa - check if payment was verified
      api.checkChapaStatus(txRef).then(tx => {
        if (tx.status === 'verified') {
          // Payment succeeded - create the order
          handlePaymentSuccess(`chapa_${txRef}`)
        } else {
          // Wait 2 seconds and check again (Chapa callback may be processing)
          setTimeout(() => {
            api.checkChapaStatus(txRef).then(tx2 => {
              if (tx2.status === 'verified') {
                handlePaymentSuccess(`chapa_${txRef}`)
              } else {
                setErrors({ payment: 'Payment is being processed. You will receive confirmation shortly. Check your account page for updates.' })
                setStep(3)
              }
            }).catch(() => {
              setErrors({ payment: 'Payment verification pending. Check your account page for updates.' })
              setStep(3)
            })
          }, 2000)
        }
      }).catch(() => {
        setErrors({ payment: 'Payment verification pending. Check your account page for updates.' })
        setStep(3)
      })
      // Clean up URL params
      window.history.replaceState({}, '', '/#/checkout')
    } else if (items.length === 0 && step !== 3) {
      navigate('/shop')
    }
  }, [user, items, step, navigate])

  const validate = (field) => {
    const e = {}
    if (!form.shipping_name.trim()) e.shipping_name = 'Full name is required'
    if (!form.shipping_email.trim()) e.shipping_email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.shipping_email)) e.shipping_email = 'Enter a valid email'
    if (!form.shipping_address.trim()) e.shipping_address = 'Address is required'
    if (!form.shipping_city.trim()) e.shipping_city = 'City is required'
    if (!form.shipping_country) e.shipping_country = 'Country is required'
    if (form.shipping_phone && !/^[+]?[\d\s()-]{7,20}$/.test(form.shipping_phone)) e.shipping_phone = 'Enter a valid phone number'
    if (field) return !e[field]
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) {
      setErrors(prev => { const n = { ...prev }; delete n[name]; return n })
    }
  }

  const handleBlur = (e) => {
    validate(e.target.name)
  }

  const handleShippingSubmit = async (e) => {
    e.preventDefault()
    if (validate()) {
      setStep(2)
      // Create payment intent when moving to payment step
      try {
        const data = await api.createPayment()
        setClientSecret(data.clientSecret)
      } catch (err) {
        // Ethiopian payment methods don't need Stripe
        setClientSecret(null)
      }
    }
  }

  const handlePaymentSuccess = async (paymentIntentId) => {
    setLoading(true)
    try {
      const newOrder = await api.createOrder({
        ...form,
        payment_intent_id: paymentIntentId,
        notes: orderNotes || form.notes,
      })
      setOrder(newOrder)
      setStep(3)
      clearAll()

      api.sendOrderConfirmation({
        orderId: newOrder.id,
        email: form.shipping_email,
        items: newOrder.items,
        total: newOrder.total,
      }).catch(() => {})
    } catch (err) {
      setErrors({ payment: err.message || 'Failed to place order.' })
    } finally {
      setLoading(false)
    }
  }

  if (step === 3 && order) {
    return (
      <section className="section checkout-page">
        <div className="container" style={{ maxWidth: 600, textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <div className="checkout-success">
              <div className="success-icon"><Check size={48} strokeWidth={1.5} /></div>
              <h2 className="checkout-success-title">Order Confirmed</h2>
              <p className="checkout-success-text">
                Thank you for your order. A confirmation has been sent to <strong>{form.shipping_email}</strong>.
                You can track your order status in your account.
              </p>
              <div className="order-confirmation-details">
                <div className="confirmation-row"><span>Order Number</span><strong>#{order.id}</strong></div>
                <div className="confirmation-row"><span>Total</span><strong>${order.total.toFixed(2)}</strong></div>
                <div className="confirmation-row"><span>Shipping To</span><strong>{order.shipping_city}, {order.shipping_country}</strong></div>
                <div className="confirmation-row"><span>Payment</span><span className="badge">{order.payment_status === 'paid' ? 'Paid' : 'Pending'}</span></div>
                <div className="confirmation-row"><span>Status</span><span className="badge">{order.status}</span></div>
              </div>
              <div className="confirmation-items">
                {order.items.map((item, i) => (
                  <div key={i} className="confirmation-item">
                    <span>{item.product_name} x{item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="checkout-success-actions">
                <button onClick={() => navigate('/account')} className="btn btn--primary">View My Orders</button>
                <button onClick={() => navigate('/shop')} className="btn btn--outline-dark">Continue Shopping</button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <section className="section checkout-page">
      <div className="container" style={{ maxWidth: 900 }}>
        <button onClick={() => step === 2 ? setStep(1) : navigate('/shop')} className="checkout-back">
          <ArrowLeft size={16} /> {step === 2 ? 'Back to Shipping' : 'Back to Shop'}
        </button>

        <div className="checkout-steps">
          <div className={`checkout-step ${step >= 1 ? 'checkout-step--active' : ''}`}>
            <span className="step-num">1</span> Shipping
          </div>
          <div className="checkout-step-line" />
          <div className={`checkout-step ${step >= 2 ? 'checkout-step--active' : ''}`}>
            <span className="step-num">2</span> Payment
          </div>
        </div>

        <div className="checkout-layout">
          <div className="checkout-main">
            {errors.payment && (
              <div className="checkout-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} /> {errors.payment}
              </div>
            )}

            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="checkout-section">
                <h2 className="checkout-section-title">Shipping Information</h2>
                <form onSubmit={handleShippingSubmit} className="checkout-form" noValidate>
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text" name="shipping_name" required
                      value={form.shipping_name} onChange={handleChange} onBlur={handleBlur}
                      placeholder="John Smith"
                      style={errors.shipping_name ? { borderColor: '#E74C3C' } : {}}
                    />
                    {errors.shipping_name && <span style={{ color: '#E74C3C', fontSize: '.78rem' }}>{errors.shipping_name}</span>}
                  </div>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email" name="shipping_email" required
                      value={form.shipping_email} onChange={handleChange} onBlur={handleBlur}
                      placeholder="john@example.com"
                      style={errors.shipping_email ? { borderColor: '#E74C3C' } : {}}
                    />
                    {errors.shipping_email && <span style={{ color: '#E74C3C', fontSize: '.78rem' }}>{errors.shipping_email}</span>}
                  </div>
                  <div className="form-group">
                    <label>Street Address *</label>
                    <input
                      type="text" name="shipping_address" required
                      value={form.shipping_address} onChange={handleChange} onBlur={handleBlur}
                      placeholder="123 Main Street, Apt 4B"
                      style={errors.shipping_address ? { borderColor: '#E74C3C' } : {}}
                    />
                    {errors.shipping_address && <span style={{ color: '#E74C3C', fontSize: '.78rem' }}>{errors.shipping_address}</span>}
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>City *</label>
                      <input
                        type="text" name="shipping_city" required
                        value={form.shipping_city} onChange={handleChange} onBlur={handleBlur}
                        placeholder="New York"
                        style={errors.shipping_city ? { borderColor: '#E74C3C' } : {}}
                      />
                      {errors.shipping_city && <span style={{ color: '#E74C3C', fontSize: '.78rem' }}>{errors.shipping_city}</span>}
                    </div>
                    <div className="form-group">
                      <label>Country *</label>
                      <select
                        name="shipping_country" required
                        value={form.shipping_country} onChange={handleChange} onBlur={handleBlur}
                        style={{ ...{ padding: '12px 16px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.92rem', background: 'var(--white)' }, ...(errors.shipping_country ? { borderColor: '#E74C3C' } : {}) }}
                      >
                        <option value="">Select country</option>
                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {errors.shipping_country && <span style={{ color: '#E74C3C', fontSize: '.78rem' }}>{errors.shipping_country}</span>}
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Postal Code</label>
                      <input type="text" name="shipping_postal" value={form.shipping_postal} onChange={handleChange} placeholder="10001" />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel" name="shipping_phone"
                        value={form.shipping_phone} onChange={handleChange} onBlur={handleBlur}
                        placeholder="+251 9XX XXX XXX"
                        style={errors.shipping_phone ? { borderColor: '#E74C3C' } : {}}
                      />
                      {errors.shipping_phone && <span style={{ color: '#E74C3C', fontSize: '.78rem' }}>{errors.shipping_phone}</span>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Order Notes</label>
                    <textarea name="notes" rows="3" value={form.notes} onChange={handleChange} placeholder="Any special delivery instructions or gift messages..." />
                  </div>
                  <button type="submit" className="btn btn--primary btn--lg btn--block">Continue to Payment</button>
                </form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="checkout-section">
                <h2 className="checkout-section-title"><CreditCard size={20} /> Payment</h2>

                <PaymentForm
                  clientSecret={clientSecret}
                  amount={total}
                  onPaymentSuccess={handlePaymentSuccess}
                  onOrderNotes={setOrderNotes}
                  shippingEmail={form.shipping_email}
                  shippingName={form.shipping_name}
                />

                <div className="shipping-summary" style={{ marginTop: 20 }}>
                  <h3 style={{ fontFamily: 'var(--ff-heading)', fontSize: '1.05rem', marginBottom: 10 }}>Shipping to</h3>
                  <p style={{ fontSize: '.9rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text)' }}>{form.shipping_name}</strong><br />
                    {form.shipping_address}<br />
                    {form.shipping_city}, {form.shipping_country} {form.shipping_postal}<br />
                    {form.shipping_email}
                  </p>
                </div>

                <p style={{ textAlign: 'center', fontSize: '.78rem', color: 'var(--text-muted)', marginTop: 16 }}>
                  By placing this order, you agree to our <a href="/terms" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>Terms of Service</a>
                </p>
              </motion.div>
            )}
          </div>

          <div className="checkout-sidebar">
            <div className="order-summary-card">
              <h3 className="order-summary-title"><ShoppingBag size={18} /> Order Summary</h3>
              <div className="order-summary-items">
                {items.map(item => (
                  <div key={item.id} className="order-summary-item">
                    <div className="summary-item-info">
                      <span className="summary-item-name">{item.name}</span>
                      <span className="summary-item-qty">x{item.quantity}</span>
                    </div>
                    <span className="summary-item-price">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="order-summary-totals">
                <div className="summary-row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="summary-row"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span></div>
                <div className="summary-row"><span>Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
                <div className="summary-row summary-row--total"><span>Total</span><span>${total.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
