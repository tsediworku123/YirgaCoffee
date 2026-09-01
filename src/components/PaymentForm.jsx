import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { CreditCard, Smartphone, Building2, Lock, Check, AlertCircle, ExternalLink, Loader } from 'lucide-react'
import { api } from '../api'

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PK || ''
)

const CARD_STYLE = {
  style: {
    base: {
      fontSize: '16px',
      color: '#2D2016',
      fontFamily: '"Inter", sans-serif',
      fontSmoothing: 'antialiased',
      '::placeholder': { color: '#8B7D70' },
      padding: '12px',
    },
    invalid: {
      color: '#E74C3C',
      iconColor: '#E74C3C',
    },
  },
}

const ethiopianMethods = [
  {
    id: 'telebirr',
    name: 'Telebirr',
    desc: 'Pay with Ethio Telecom mobile wallet',
    icon: Smartphone,
    color: '#E31837',
    instructions: 'You will be redirected to the Chapa secure checkout to complete payment via Telebirr.',
    currency: 'ETB',
  },
  {
    id: 'cbe_birr',
    name: 'CBE Birr',
    desc: 'Commercial Bank of Ethiopia mobile banking',
    icon: Building2,
    color: '#0066B3',
    instructions: 'You will be redirected to the Chapa secure checkout to pay via CBE Birr.',
    currency: 'ETB',
  },
  {
    id: 'amole',
    name: 'Amole',
    desc: 'Dashen Bank digital payment',
    icon: Smartphone,
    color: '#FF6600',
    instructions: 'You will be redirected to the Chapa secure checkout to pay via Amole.',
    currency: 'ETB',
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    desc: 'Direct bank wire transfer (ETB or USD)',
    icon: Building2,
    color: '#4A7C59',
    instructions: 'You will be redirected to the Chapa secure checkout to complete a bank transfer.',
    currency: 'ETB',
  },
]

function StripeCardForm({ clientSecret, amount, shippingName, shippingEmail, onSuccess }) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    setError(null)

    const card = elements.getElement(CardElement)

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: shippingName || 'Customer',
            email: shippingEmail || '',
          },
        },
      })

      if (stripeError) {
        setError(stripeError.message)
        setProcessing(false)
        return
      }

      if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id)
      }
    } catch (err) {
      setError('Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#FDECEA', borderRadius: 6, marginBottom: 16, fontSize: '.88rem', color: '#E74C3C' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      <div style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 4, background: 'var(--white)', marginBottom: 16 }}>
        <CardElement options={CARD_STYLE} />
      </div>
      <button type="submit" disabled={!stripe || processing} className="btn btn--primary btn--lg btn--block" style={{ marginTop: 8 }}>
        {processing ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Loader size={16} style={{ animation: 'spin .6s linear infinite' }} />
            Processing...
          </span>
        ) : (
          <>
            <Lock size={16} /> Pay ${amount.toFixed(2)}
          </>
        )}
      </button>
    </form>
  )
}

export default function PaymentForm({ clientSecret, amount, onPaymentSuccess, onOrderNotes, shippingEmail, shippingName }) {
  const [selectedMethod, setSelectedMethod] = useState('card')
  const [phone, setPhone] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const isEthiopianMethod = selectedMethod !== 'card'
  const activeEthMethod = ethiopianMethods.find(m => m.id === selectedMethod)

  const handleChapaPayment = async () => {
    setProcessing(true)
    setError('')

    try {
      // Approximate USD to ETB conversion (for display; Chapa handles real conversion)
      const amountInETB = Math.round(amount * 155) // ~155 ETB per USD

      const result = await api.initializeChapaPayment({
        amount: amountInETB,
        currency: 'ETB',
        method: selectedMethod,
        phone: phone,
        email: shippingEmail || '',
        first_name: shippingName?.split(' ')[0] || '',
        last_name: shippingName?.split(' ').slice(1).join(' ') || '',
      })

      if (result.checkout_url) {
        // Store tx_ref in session so we can check it on return
        sessionStorage.setItem('chapa-tx-ref', result.tx_ref)
        // Redirect to Chapa hosted checkout
        window.location.href = result.checkout_url
      } else {
        setError('Failed to initialize payment. Please try again.')
        setProcessing(false)
      }
    } catch (err) {
      setError(err.message || 'Payment initialization failed')
      setProcessing(false)
    }
  }

  const handleBankTransfer = () => {
    // Bank transfer still goes through Chapa for proper tracking
    handleChapaPayment()
  }

  return (
    <div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .payment-tab { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; transition: var(--transition); flex: 1; background: var(--white); font-size: .9rem; font-weight: 500; }
        .payment-tab:hover { border-color: var(--gold); }
        .payment-tab--active { border-color: var(--gold); background: rgba(200,169,110,.06); }
        .eth-method { display: flex; align-items: center; gap: 14px; padding: 14px 18px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; transition: var(--transition); }
        .eth-method:hover { border-color: var(--gold); }
        .eth-method--active { border-color: var(--gold); background: rgba(200,169,110,.06); }
        .eth-method-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .eth-method-name { font-weight: 600; font-size: .92rem; }
        .eth-method-desc { font-size: .78rem; color: var(--text-muted); }
        .chapa-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: #1a73e8; color: #fff; border-radius: 4px; font-size: .65rem; font-weight: 700; letter-spacing: .3px; text-transform: uppercase; margin-left: 6px; }
      `}</style>

      {/* Payment method tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button type="button" className={`payment-tab ${!isEthiopianMethod ? 'payment-tab--active' : ''}`} onClick={() => { setSelectedMethod('card'); setError('') }}>
          <CreditCard size={20} /> Card
        </button>
        <button type="button" className={`payment-tab ${isEthiopianMethod ? 'payment-tab--active' : ''}`} onClick={() => { setSelectedMethod('telebirr'); setError('') }}>
          <Smartphone size={20} /> Ethiopian Payment
        </button>
      </div>

      {/* Stripe Card Form */}
      {selectedMethod === 'card' && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <StripeCardForm
            clientSecret={clientSecret}
            amount={amount}
            shippingName={shippingName}
            shippingEmail={shippingEmail}
            onSuccess={onPaymentSuccess}
          />
        </Elements>
      )}

      {selectedMethod === 'card' && !clientSecret && (
        <div style={{ padding: '28px', background: 'var(--cream)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <CreditCard size={36} style={{ color: 'var(--gold)', marginBottom: 12 }} />
          <p style={{ fontSize: '.95rem', fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
            Card payments require Stripe configuration
          </p>
          <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Add your Stripe keys to the <code style={{ background: 'var(--border)', padding: '2px 6px', borderRadius: 3, fontSize: '.8rem' }}>.env</code> file to accept Visa, Mastercard, Amex, and more.
          </p>
          <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Use Ethiopian payment methods below in the meantime.
          </p>
        </div>
      )}

      {/* Ethiopian Payment Methods via Chapa */}
      {isEthiopianMethod && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {ethiopianMethods.map(m => {
              const Icon = m.icon
              return (
                <div key={m.id} className={`eth-method ${selectedMethod === m.id ? 'eth-method--active' : ''}`} onClick={() => { setSelectedMethod(m.id); setError('') }}>
                  <div className="eth-method-icon" style={{ background: `${m.color}15`, color: m.color }}>
                    <Icon size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="eth-method-name">{m.name}</span>
                      <span className="chapa-badge">Chapa</span>
                    </div>
                    <div className="eth-method-desc">{m.desc}</div>
                  </div>
                  <ExternalLink size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>
              )
            })}
          </div>

          {/* Error display */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#FDECEA', borderRadius: 6, marginBottom: 16, fontSize: '.88rem', color: '#E74C3C' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Phone number for mobile wallets */}
          {(selectedMethod === 'telebirr' || selectedMethod === 'cbe_birr' || selectedMethod === 'amole') && (
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '.88rem', fontWeight: 600 }}>Phone Number (linked to {activeEthMethod?.name})</label>
              <input
                type="tel"
                placeholder="251900000000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.92rem' }}
              />
              <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Test mode: use 251900000000 for success. On the Chapa page, select <strong>"Test Card Payment"</strong> and click <strong>"Pay using Test Mode"</strong>.
              </p>
            </div>
          )}

          {/* Instructions */}
          <div style={{ padding: '14px 18px', background: 'var(--cream)', borderRadius: 'var(--radius-sm)', marginBottom: 16, fontSize: '.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Lock size={14} style={{ color: 'var(--gold)' }} />
              <strong style={{ color: 'var(--text)', fontSize: '.88rem' }}>Secure Checkout via Chapa</strong>
            </div>
            {activeEthMethod?.instructions}
            <div style={{ marginTop: 8, fontSize: '.82rem' }}>
              Amount: <strong style={{ color: 'var(--text)' }}>
                {selectedMethod === 'bank_transfer' ? `$${amount.toFixed(2)} USD / ~ETB ${Math.round(amount * 155).toLocaleString()}` : `~ETB ${Math.round(amount * 155).toLocaleString()}`}
              </strong>
              <span style={{ fontSize: '.75rem', marginLeft: 6 }}>(approximate ETB conversion)</span>
            </div>
            <div style={{ marginTop: 8, padding: '8px 12px', background: '#FFF3CD', borderRadius: 6, fontSize: '.8rem', color: '#856404', border: '1px solid #FFEAA7' }}>
              <strong>Testing Tip:</strong> On the Chapa checkout page, click <strong>"Test Card Payment"</strong> on the left, then <strong>"Pay using Test Mode"</strong>. Mobile money test payments may show an error but still process successfully.
            </div>
          </div>

          <button
            onClick={selectedMethod === 'bank_transfer' ? handleBankTransfer : handleChapaPayment}
            className="btn btn--primary btn--lg btn--block"
            disabled={processing}
          >
            {processing ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Loader size={16} style={{ animation: 'spin .6s linear infinite' }} />
                Redirecting to Chapa...
              </span>
            ) : (
              <>
                <Lock size={16} /> Pay via {activeEthMethod?.name} — ~ETB {Math.round(amount * 155).toLocaleString()}
              </>
            )}
          </button>
        </div>
      )}

      <p style={{ textAlign: 'center', fontSize: '.78rem', color: 'var(--text-muted)', marginTop: 16 }}>
        <Lock size={12} style={{ verticalAlign: -2 }} /> Payments processed by Stripe (cards) or Chapa (Ethiopian methods). We never store your payment details.
      </p>
    </div>
  )
}
